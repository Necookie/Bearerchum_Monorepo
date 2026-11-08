"""SQLite storage. One file at $DATA_DIR/bearerchum.db (mounted as a Coolify volume)."""
import os
import sqlite3
from contextlib import contextmanager

DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.path.dirname(__file__), "..", "data"))
DB_PATH = os.path.join(DATA_DIR, "bearerchum.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE COLLATE NOCASE,
    pin_hash    TEXT NOT NULL,
    salt        TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    last_seen   INTEGER NOT NULL,
    settings    TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS sessions (
    token_hash  TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS card_states (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id     TEXT NOT NULL,
    state       TEXT NOT NULL,
    due         INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL,
    PRIMARY KEY (user_id, card_id)
);
CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id     TEXT NOT NULL,
    grade       INTEGER NOT NULL,
    is_new      INTEGER NOT NULL DEFAULT 0,
    ts          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS reviews_user_ts ON reviews(user_id, ts);
CREATE TABLE IF NOT EXISTS problem_status (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id  TEXT NOT NULL,
    best_passed INTEGER NOT NULL DEFAULT 0,
    total       INTEGER NOT NULL DEFAULT 0,
    solved      INTEGER NOT NULL DEFAULT 0,
    attempts    INTEGER NOT NULL DEFAULT 0,
    solved_at   INTEGER,
    last_ts     INTEGER NOT NULL,
    PRIMARY KEY (user_id, problem_id)
);
CREATE TABLE IF NOT EXISTS attempts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id  TEXT NOT NULL,
    kind        TEXT NOT NULL,
    passed      INTEGER NOT NULL,
    total       INTEGER NOT NULL,
    ts          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_user_ts ON attempts(user_id, ts);
CREATE TABLE IF NOT EXISTS drafts (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id  TEXT NOT NULL,
    code        TEXT NOT NULL,
    updated_at  INTEGER NOT NULL,
    PRIMARY KEY (user_id, problem_id)
);
"""


def init():
    os.makedirs(DATA_DIR, exist_ok=True)
    with connect() as c:
        c.executescript(SCHEMA)


@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
