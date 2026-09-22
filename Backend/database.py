import os
from contextlib import contextmanager
import mysql.connector
from mysql.connector import Error, pooling
from dotenv import load_dotenv

# Load .env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "churn_prediction")

# MySQL Connection Pool
_pool = None


def get_connection_pool():
    global _pool
    if _pool is None:
        try:
            _pool = pooling.MySQLConnectionPool(
                pool_name="churn_pool",
                pool_size=10,
                pool_reset_session=True,
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME
            )
        except Error as err:
            # Fall back to direct connection if pooling cannot be initialized
            _pool = None
    return _pool


def get_database_connection():
    """Return an active MySQL connection or raise an Error."""
    pool = get_connection_pool()
    if pool:
        try:
            conn = pool.get_connection()
            if conn.is_connected():
                return conn
        except Error:
            pass

    # Direct connection fallback
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        if conn.is_connected():
            return conn
        raise Error("Failed to establish MySQL connection")
    except Error as err:
        raise err


@contextmanager
def get_db_cursor(dictionary=True, commit=False):
    """Context manager for acquiring and closing MySQL connections and cursors."""
    conn = get_database_connection()
    cursor = conn.cursor(dictionary=dictionary)
    try:
        yield cursor
        if commit:
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass