import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "twitter_sentiment.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "db" / "schema.sql"


def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def run_migrations(conn):
    """Ajoute colonnes manquantes sur bases existantes."""
    cols = {r[1] for r in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "first_name" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT ''")
    if "last_name" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT ''")
    conn.commit()


def init_db():
    conn = get_db()
    conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    run_migrations(conn)
    conn.commit()
    conn.close()
