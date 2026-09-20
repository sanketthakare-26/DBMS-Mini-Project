import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()


def get_database_connection():
    """Return a MySQL connection or raise an exception on failure."""
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
        )

        if connection.is_connected():
            return connection

        raise Error("Connection object is not connected")

    except Error as error:
        print("MySQL connection error:", error)
        raise error