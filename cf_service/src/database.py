import psycopg2
import psycopg2.extras
from psycopg2 import pool as pg_pool
import os
from dotenv import load_dotenv

load_dotenv()

_pool = None


def _get_pool():
    global _pool
    if _pool is None:
        _pool = pg_pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
        )
    return _pool


def fetch_all(query: str, params=None):
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            return cur.fetchall()
    except Exception as e:
        print(f"Database error: {e}", flush=True)
        raise
    finally:
        pool.putconn(conn)