#[macro_use]
extern crate rocket;

use std::{
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};

use rocket::{
    fairing::{self, AdHoc},
    fs::{relative, NamedFile},
    response::status::Created,
    serde::{json::Json, ser::SerializeStruct, Deserialize, Serialize},
    {Build, Rocket},
};

use futures::{future::TryFutureExt, stream::TryStreamExt};
use rocket_db_pools::{sqlx, Connection, Database};

#[derive(Database)]
#[database("sqlx")]
struct Db(sqlx::SqlitePool);

type Result<T, E = rocket::response::Debug<sqlx::Error>> = std::result::Result<T, E>;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
struct Post {
    #[serde(skip_deserializing, skip_serializing_if = "Option::is_none")]
    id: Option<i64>,
    camid: i64,
    starttime: Option<String>,
    endtime: Option<String>,
    name: Option<String>,
}

#[derive(Debug, Clone)]
struct Camera {
    name: String,
    model: String,
    uid: String,
    distribution: Option<(u64, String)>,
}

impl rocket::serde::ser::Serialize for Camera {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: rocket::serde::ser::Serializer,
    {
        match &self.distribution {
            Some((starttime, user)) => {
                let mut state = serializer.serialize_struct("Camera", 5)?;
                state.serialize_field("name", &self.name)?;
                state.serialize_field("model", &self.model)?;
                state.serialize_field("uid", &self.uid)?;
                state.serialize_field("starttime", starttime)?;
                state.serialize_field("user", user)?;
                state.end()
            }
            None => {
                let mut state = serializer.serialize_struct("Camera", 3)?;
                state.serialize_field("name", &self.name)?;
                state.serialize_field("model", &self.model)?;
                state.serialize_field("uid", &self.uid)?;
                state.end()
            }
        }
    }
}

#[post("/", data = "<post>")]
async fn create(mut db: Connection<Db>, mut post: Json<Post>) -> Result<Created<Json<Post>>> {
    let results = sqlx::query!(
        "INSERT INTO posts (camid, starttime, endtime, name) VALUES (?, ?, ?, ?) RETURNING id",
        post.camid,
        post.starttime,
        post.endtime,
        post.name
    )
    .fetch(&mut **db)
    .try_collect::<Vec<_>>()
    .await?;

    post.id = Some(results.first().expect("returning results").id);
    Ok(Created::new("/").body(post))
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

#[get("/<id>")]
async fn read(mut db: Connection<Db>, id: i64) -> Option<Json<Post>> {
    sqlx::query!(
        "SELECT id, camid, starttime, endtime, name FROM posts WHERE id = ?",
        id
    )
    .fetch_one(&mut **db)
    .map_ok(|r| {
        Json(Post {
            id: Some(r.id),
            camid: r.camid,
            starttime: r.starttime,
            endtime: r.endtime,
            name: r.name,
        })
    })
    .await
    .ok()
}

#[delete("/<id>")]
async fn delete(mut db: Connection<Db>, id: i64) -> Result<Option<()>> {
    let result = sqlx::query!("DELETE FROM posts WHERE id = ?", id)
        .execute(&mut **db)
        .await?;

    Ok((result.rows_affected() == 1).then(|| ()))
}

#[delete("/")]
async fn destroy(mut db: Connection<Db>) -> Result<()> {
    sqlx::query!("DELETE FROM posts").execute(&mut **db).await?;

    Ok(())
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

pub fn stage() -> AdHoc {
    AdHoc::on_ignite("SQLx Stage", |rocket| async {
        rocket
            .attach(Db::init())
            .attach(AdHoc::try_on_ignite("SQLx Migrations", run_migrations))
            .mount("/api", routes![list, create, read, delete, destroy, cams])
    })
}

#[get("/<path..>", rank = 1)]
async fn files(path: PathBuf) -> Option<NamedFile> {
    let mut path = Path::new(relative!("../web/build")).join(path);
    if path.is_dir() {
        path.push("index.html");
    }

    NamedFile::open(path).await.ok()
}

static CAMERAS: Mutex<Vec<Camera>> = Mutex::new(Vec::new());

#[post("/cams")]
async fn cams() -> Result<Json<Vec<Camera>>> {
    let val = CAMERAS.lock().unwrap();
    Ok(Json(val.clone()))
}

#[rocket::main]
async fn main() {
    let json: serde_json::Value = match fs::File::open("db/state.json") {
        Ok(x) => serde_json::from_reader(x).unwrap(),
        Err(_) => unimplemented!(),
    };
    // println!("{json:?}");
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
                    uid: obj
                        .get("uid")
                        .unwrap()
                        .as_str()
                        .expect("not string in uid field")
                        .to_string(),
                    distribution: match obj.get("starttime") {
                        Some(x) => Some((
                            x.as_u64().expect("not u64 in starttime"),
                            obj.get("user").unwrap().as_str().unwrap().to_string(),
                        )),
                        None => None,
                    },
                }
            })
            .collect::<Vec<Camera>>();
    }
    let _result = rocket::build()
        .mount("/", routes![files])
        .attach(stage())
        .launch()
        .await;
    println!("finished");
}
