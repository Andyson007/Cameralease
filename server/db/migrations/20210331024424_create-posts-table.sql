CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR NOT NULL,
    text VARCHAR NOT NULL,
    test VARCHAR NOT NULL,
    published BOOLEAN NOT NULL DEFAULT 0
);
