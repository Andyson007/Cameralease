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
struct Camera {
    name: String,
    model: String,
    uid: u32,
    distribution: Option<(u32, String)>,
    reservations: Vec<(u32, u32)>,
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

#[post("/cams")]
async fn cams() -> Result<Json<Vec<Camera>>> {
    let val = CAMERAS.lock().unwrap();
    Ok(Json(val.to_vec()))
}

#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
struct Lease {
    start: u32,
    end: Option<u32>,
    uid: usize,
    user: String,
}

#[post("/lease", data = "<data>")]
async fn lease(mut db: Connection<Db>, data: Json<Lease>) -> Result<Status> {
    match data.end {
        Some(end) => {
            {
                let mut val = CAMERAS.lock().unwrap();
                let camera = match val.get_mut(data.uid) {
                    None => {
                        return Ok(Status::BadRequest);
                    }
                    Some(x) => x,
                };
                if (*camera).distribution.is_none() {
                    return Ok(Status::BadRequest);
                }
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
                None => {
                    return Ok(Status::BadRequest);
                }
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
        path.push("indet.html");
    }
    NamedFile::open(path).await.ok()
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
    let json: serde_json::Value = match fs::File::open("db/state.json") {
        Ok(x) => serde_json::from_reader(x).unwrap(),
        Err(_) => unimplemented!(),
    };
    {
        let mut val = CAMERAS.lock().unwrap();

        *val = json
            .get("cameras")
            .unwrap()
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
                            let arr = x
                                .as_array()
                                .unwrap()
                                .iter()
                                .map(|x| x.as_u64().expect("Non u64 in reservations") as u32)
                                .collect::<Vec<u32>>();
                            (arr[0], arr[1])
                        })
                        .collect(),
                }
            })
            .collect::<Vec<Camera>>();
        println!("{val:#?}");
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
            .open("db/state.json")
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
            .mount("/api", routes![cams, lease])
            .mount("/api", routes![list, read])
    })
}
