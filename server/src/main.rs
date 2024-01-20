#[macro_use]
extern crate rocket;

use std::{
    fs::{self, OpenOptions},
    io::{BufWriter, Write},
    path::{Path, PathBuf},
    sync::Mutex,
};

use serde_json::json;

use rocket::{
    fairing::{self, AdHoc},
    fs::{relative, NamedFile},
    http::Status,
    serde::{json::Json, ser::SerializeStruct, Deserialize, Serialize},
    {Build, Rocket},
};

use futures::{stream::TryStreamExt, TryFutureExt};
use rocket_db_pools::{sqlx, Connection, Database};

#[derive(Database)]
#[database("sqlx")]
struct Db(sqlx::SqlitePool);
static CAMERAS: Mutex<Vec<Camera>> = Mutex::new(Vec::new());

type Result<T, E = rocket::response::Debug<sqlx::Error>> = std::result::Result<T, E>;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
struct Entry {
    #[serde(skip_deserializing, skip_serializing_if = "Option::is_none")]
    id: Option<i64>,
    camid: i64,
    starttime: Option<u32>,
    endtime: Option<u32>,
    name: Option<String>,
}

#[derive(Debug, Clone)]
struct Reservation {
    start: u32,
    end: u32,
    user: String,
}

#[derive(Debug, Clone)]
struct Camera {
    name: String,
    model: String,
    uid: u32,
    distribution: Option<(u32, String)>,
    reservations: Vec<Reservation>,
}

impl rocket::serde::ser::Serialize for Reservation {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: rocket::serde::ser::Serializer,
    {
        let mut state = serializer.serialize_struct("Reservation", 3)?;
        state.serialize_field("start", &self.start)?;
        state.serialize_field("end", &self.end)?;
        state.serialize_field("user", &self.user)?;
        state.end()
    }
}

impl rocket::serde::ser::Serialize for Camera {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: rocket::serde::ser::Serializer,
    {
        match &self.distribution {
            Some((starttime, user)) => {
                let mut state = serializer.serialize_struct("Camera", 6)?;
                state.serialize_field("name", &self.name)?;
                state.serialize_field("model", &self.model)?;
                state.serialize_field("uid", &self.uid)?;
                state.serialize_field("starttime", starttime)?;
                state.serialize_field("user", user)?;
                state.serialize_field("reservations", &self.reservations)?;
                state.end()
            }
            None => {
                let mut state = serializer.serialize_struct("Camera", 4)?;
                state.serialize_field("name", &self.name)?;
                state.serialize_field("model", &self.model)?;
                state.serialize_field("uid", &self.uid)?;
                state.serialize_field("reservations", &self.reservations)?;
                state.end()
            }
        }
    }
}

#[get("/")]
async fn list(mut db: Connection<Db>) -> Result<Json<Vec<i64>>> {
    let ids = sqlx::query!("SELECT id FROM posts")
        .fetch(&mut **db)
        .map_ok(|record| record.id)
        .try_collect::<Vec<_>>()
        .await?;
    Ok(Json(ids))
}

async fn run_migrations(rocket: Rocket<Build>) -> fairing::Result {
    match Db::fetch(&rocket) {
        Some(db) => match sqlx::migrate!("db/migrations").run(&**db).await {
            Ok(_) => Ok(rocket),
            Err(e) => {
                error!("Failed to initialize SQLx database: {}", e);
                Err(rocket)
            }
        },
        None => Err(rocket),
    }
}

#[get("/cams")]
async fn cams() -> Result<Json<Vec<Camera>>> {
    let val = CAMERAS.lock().unwrap();
    Ok(Json(val.to_vec()))
}

#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
struct ReservationInput {
    start: u32,
    end: u32,
    uid: usize,
    user: String,
}

#[derive(Responder)]
enum Response {
    #[response(status = 400, content_type = "text")]
    Invalid(String),
    #[response(status = 202, content_type = "json")]
    Valid(Json<Camera>),
}

#[post("/reserve", data = "<data>")]
async fn reserve(data: Json<ReservationInput>) -> Result<Response> {
    let mut val = CAMERAS.lock().unwrap();
    let camera = match val.get_mut(data.uid) {
        None => return Ok(Response::Invalid(String::from("Not valid uid"))),
        Some(x) => x,
    };
    if camera.reservations.iter().any(
        |Reservation {
             start,
             end,
             user: _,
         }| {
            (data.start <= *start && *start < data.end)
                || (data.start < *end && *end < data.end)
                || (*start < data.start && data.start < *end)
        },
    ) {
        return Ok(Response::Invalid(String::from(
            "Reservation already present",
        )));
    }
    camera.reservations.push(Reservation {
        start: data.start,
        end: data.end,
        user: data.user.clone(),
    });
    Ok(Response::Valid(Json(camera.clone())))
}

#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
struct Lease {
    start: u32,
    end: Option<u32>,
    uid: usize,
    user: String,
}

/// This function will return an error(400) if the lease request starts
/// a lease that has already been started
#[post("/lease", data = "<data>")]
async fn lease(mut db: Connection<Db>, data: Json<Lease>) -> Result<Status> {
    match data.end {
        Some(end) => {
            {
                let mut val = CAMERAS.lock().unwrap();
                let camera = match val.get_mut(data.uid) {
                    None => return Ok(Status::BadRequest),
                    Some(x) => x,
                };
                camera.distribution = None;
            }
            let uid = data.uid as u32;
            sqlx::query!(
                "INSERT INTO posts (camid, starttime, endtime, name) VALUES (?, ?, ?, ?) RETURNING id",
                uid,
                data.start,
                end,
                data.user)
            .fetch(&mut **db)
            .try_collect::<Vec<_>>()
            .await?;
        }
        None => {
            let mut val = CAMERAS.lock().unwrap();
            let camera = match val.get_mut(data.uid) {
                None => return Ok(Status::BadRequest),
                Some(x) => x,
            };
            if (*camera).distribution.is_some() {
                return Ok(Status::BadRequest);
            }
            camera.distribution = Some((data.start, data.user.clone()));
        }
    }
    Ok(Status::Accepted)
}

#[get("/<path..>", rank = 1)]
async fn files(path: PathBuf) -> Option<NamedFile> {
    let mut path = Path::new(relative!("../web/build")).join(path);
    if path.is_dir() {
        path.push("index.html");
    }
    NamedFile::open(path).await.ok()
}

#[get("/history")]
async fn history(mut db: Connection<Db>) -> Option<Json<Vec<Entry>>> {
    sqlx::query!("SELECT id, camid, starttime, endtime, name FROM posts")
        .fetch_all(&mut **db)
        .map_ok(|v| {
            Json(
                v.iter()
                    .map(|r| Entry {
                        id: Some(r.id),
                        camid: r.camid,
                        starttime: match &r.starttime {
                            Some(x) => Some(x.parse::<u32>().expect("strattime isn't a u32")),
                            None => None,
                        },
                        endtime: match &r.endtime {
                            Some(x) => Some(x.parse::<u32>().expect("strattime isn't a u32")),
                            None => None,
                        },
                        name: r.name.clone(),
                    })
                    .collect::<Vec<Entry>>(),
            )
        })
        .await
        .ok()
}

#[get("/<id>")]
async fn read(mut db: Connection<Db>, id: i64) -> Option<Json<Entry>> {
    sqlx::query!(
        "SELECT id, camid, starttime, endtime, name FROM posts WHERE id = ?",
        id
    )
    .fetch_one(&mut **db)
    .map_ok(|r| {
        Json(Entry {
            id: Some(r.id),
            camid: r.camid,
            starttime: Some(
                r.starttime
                    .unwrap()
                    .parse::<u32>()
                    .expect("strattime isn't a u32"),
            ),
            endtime: Some(
                r.endtime
                    .unwrap()
                    .parse::<u32>()
                    .expect("strattime isn't a u32"),
            ),
            name: r.name,
        })
    })
    .await
    .ok()
}

#[rocket::main]
async fn main() {
    let state_file = "db/state.json";
    let json: serde_json::Value = match fs::File::open(state_file) {
        Ok(x) => serde_json::from_reader(x).unwrap(),
        Err(_) => unimplemented!(),
    };
    {
        let mut val = CAMERAS.lock().unwrap();

        *val = json
            .get("cameras")
            .expect(format!("No field cameras in {state_file}").as_str())
            .as_array()
            .unwrap()
            .iter()
            .map(|x| {
                let obj = x.as_object().unwrap();
                Camera {
                    name: obj
                        .get("name")
                        .unwrap()
                        .as_str()
                        .expect("not string in name field")
                        .to_string(),
                    model: obj
                        .get("model")
                        .unwrap()
                        .as_str()
                        .expect("not string in model field")
                        .to_string(),
                    uid: obj.get("uid").unwrap().as_u64().expect("uid wasn't an u32") as u32,
                    distribution: match obj.get("starttime") {
                        Some(x) => Some((
                            x.as_u64().expect("not u64 in starttime") as u32,
                            obj.get("user").unwrap().as_str().unwrap().to_string(),
                        )),
                        None => None,
                    },
                    reservations: obj
                        .get("reservations")
                        .unwrap_or(&serde_json::Value::Array(Vec::new()))
                        .as_array()
                        .expect("reservations isn't an array")
                        .iter()
                        .map(|x| {
                            let obj = x.as_object().expect("reservation not object");
                            Reservation {
                                start: obj
                                    .get("start")
                                    .expect("no start field in reservation")
                                    .as_u64()
                                    .expect("start in reservation not u64")
                                    as u32,
                                end: obj
                                    .get("end")
                                    .expect("no end field in reservation")
                                    .as_u64()
                                    .expect("end in reservation not u64")
                                    as u32,
                                user: obj
                                    .get("user")
                                    .expect("no user field in reservation")
                                    .as_str()
                                    .expect("user filed not str")
                                    .to_string(),
                            }
                        })
                        .collect(),
                }
            })
            .collect::<Vec<Camera>>();
    }
    let _result = rocket::build()
        .mount("/", routes![files])
        .attach(stage())
        .launch()
        .await;
    let mut writer = BufWriter::new(
        OpenOptions::new()
            .write(true)
            .truncate(true)
            .open(state_file)
            .unwrap(),
    );
    let val = CAMERAS.lock().unwrap();
    serde_json::to_writer_pretty(
        &mut writer,
        &json!({
          "cameras":*val
        }),
    )
    .unwrap();
    writer.flush().unwrap();
}

pub fn stage() -> AdHoc {
    AdHoc::on_ignite("SQLx Stage", |rocket| async {
        rocket
            .attach(Db::init())
            .attach(AdHoc::try_on_ignite("SQLx Migrations", run_migrations))
            .mount("/api", routes![cams, lease, history, reserve])
            .mount("/api", routes![list, read])
    })
}
