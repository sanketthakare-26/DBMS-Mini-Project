from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from database import get_database_connection


# =============================================================================
# CREATE FASTAPI APP
# =============================================================================

app = FastAPI(
    title="Student Database API",
    description="Backend API for Student DBMS Dashboard",
    version="1.0.0"
)


# =============================================================================
# CORS CONFIGURATION
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# DATA MODELS
# =============================================================================

class Student(BaseModel):
    name: str
    branch: str
    semester: int
    marks: float
    attendance: float


# =============================================================================
# HELPER: ensure activity_log table exists
# =============================================================================

def ensure_activity_log_table():
    """Create the activity_log table if it doesn't already exist."""
    try:
        conn = get_database_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS activity_log (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                type        VARCHAR(20)  NOT NULL,
                title       VARCHAR(100) NOT NULL,
                description TEXT,
                timestamp   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print("Warning: could not create activity_log table:", e)


# Run once on startup
@app.on_event("startup")
def on_startup():
    ensure_activity_log_table()


# =============================================================================
# HELPER: log an activity entry
# =============================================================================

def log_activity(conn, type_: str, title: str, description: str):
    """Insert a row into activity_log (reuses an open connection)."""
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO activity_log (type, title, description) VALUES (%s, %s, %s)",
            (type_, title, description)
        )
        cur.close()
    except Exception as e:
        print("Warning: could not write activity log:", e)


# =============================================================================
# HELPER: normalise a student row (student_id → id, add status)
# =============================================================================

def _status(marks, attendance):
    if marks >= 85 and attendance >= 90:
        return "Excellent"
    if marks >= 70 and attendance >= 75:
        return "Good"
    if marks >= 55 and attendance >= 60:
        return "Average"
    return "Needs Attention"


def normalise(row: dict) -> dict:
    """Rename student_id to id and add computed status field."""
    if row is None:
        return row
    out = dict(row)
    if "student_id" in out:
        out["id"] = out.pop("student_id")
    if "marks" in out and "attendance" in out:
        out.setdefault("status", _status(out["marks"], out["attendance"]))
    # Serialise datetime to ISO string so JSON works
    for k, v in out.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
    return out


# =============================================================================
# HOME
# =============================================================================

@app.get("/")
def home():
    return {"message": "Student Database API is running"}


# =============================================================================
# TEST MYSQL CONNECTION
# =============================================================================

@app.get("/api/test-db")
def test_database():
    try:
        connection = get_database_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        result = cursor.fetchone()
        cursor.close()
        connection.close()
        return {
            "status": "success",
            "database": result[0],
            "message": "MySQL connection is working"
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =============================================================================
# GET ALL STUDENTS
# =============================================================================

@app.get("/api/students")
def get_students():
    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                student_id,
                name,
                branch,
                semester,
                marks,
                attendance,
                created_at
            FROM students
            ORDER BY student_id
        """)
        students = [normalise(s) for s in cursor.fetchall()]
        cursor.close()
        connection.close()
        return students
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =============================================================================
# GET SINGLE STUDENT
# =============================================================================

@app.get("/api/students/{student_id}")
def get_student(student_id: int):
    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                student_id,
                name,
                branch,
                semester,
                marks,
                attendance,
                created_at
            FROM students
            WHERE student_id = %s
        """, (student_id,))
        student = cursor.fetchone()
        cursor.close()
        connection.close()

        if student is None:
            raise HTTPException(status_code=404, detail="Student not found")

        return normalise(student)

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =============================================================================
# ADD STUDENT
# =============================================================================

@app.post("/api/students")
def add_student(student: Student):
    try:
        connection = get_database_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO students (name, branch, semester, marks, attendance)
            VALUES (%s, %s, %s, %s, %s)
        """
        values = (student.name, student.branch, student.semester, student.marks, student.attendance)
        cursor.execute(query, values)
        connection.commit()
        new_id = cursor.lastrowid
        cursor.close()

        # Log activity
        log_activity(
            connection,
            "added",
            "Student Added",
            f"{student.name} was added to the database"
        )
        connection.commit()
        connection.close()

        return {
            "message": "Student added successfully",
            "student_id": new_id,
            "id": new_id
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =============================================================================
# UPDATE STUDENT
# =============================================================================

@app.put("/api/students/{student_id}")
def update_student(student_id: int, student: Student):
    try:
        connection = get_database_connection()
        cursor = connection.cursor()

        query = """
            UPDATE students
            SET name = %s, branch = %s, semester = %s, marks = %s, attendance = %s
            WHERE student_id = %s
        """
        values = (
            student.name, student.branch, student.semester,
            student.marks, student.attendance, student_id
        )
        cursor.execute(query, values)
        connection.commit()

        if cursor.rowcount == 0:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Student not found")

        cursor.close()

        # Log activity
        log_activity(
            connection,
            "updated",
            "Student Updated",
            f"{student.name}'s record was updated (ID {student_id})"
        )
        connection.commit()
        connection.close()

        return {
            "message": "Student updated successfully",
            "student_id": student_id,
            "id": student_id
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =============================================================================
# DELETE STUDENT
# =============================================================================

@app.delete("/api/students/{student_id}")
def delete_student(student_id: int):
    try:
        connection = get_database_connection()

        # Fetch name before deleting for the activity log
        cur_name = connection.cursor(dictionary=True)
        cur_name.execute("SELECT name FROM students WHERE student_id = %s", (student_id,))
        row = cur_name.fetchone()
        cur_name.close()
        student_name = row["name"] if row else f"ID {student_id}"

        cursor = connection.cursor()
        cursor.execute("DELETE FROM students WHERE student_id = %s", (student_id,))
        connection.commit()

        if cursor.rowcount == 0:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="Student not found")

        cursor.close()

        # Log activity
        log_activity(
            connection,
            "deleted",
            "Student Deleted",
            f"{student_name} was removed from the database"
        )
        connection.commit()
        connection.close()

        return {
            "message": "Student deleted successfully",
            "student_id": student_id
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =============================================================================
# ACTIVITY LOG  ← NEW ENDPOINT
# =============================================================================

@app.get("/api/activity")
def get_activity():
    """Return the 50 most recent activity log entries."""
    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, type, title, description, timestamp
            FROM activity_log
            ORDER BY timestamp DESC
            LIMIT 50
        """)
        rows = cursor.fetchall()
        cursor.close()
        connection.close()

        result = []
        for row in rows:
            entry = dict(row)
            if isinstance(entry.get("timestamp"), datetime):
                entry["timestamp"] = entry["timestamp"].isoformat()
            result.append(entry)

        return result
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =============================================================================
# DASHBOARD ANALYTICS
# =============================================================================

@app.get("/api/analytics")
def get_analytics():
    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                COUNT(*) AS total_students,
                ROUND(AVG(marks), 2) AS average_marks,
                ROUND(AVG(attendance), 2) AS average_attendance,
                MAX(marks) AS highest_marks,
                MIN(marks) AS lowest_marks
            FROM students
        """)
        summary = cursor.fetchone()

        cursor.execute("""
            SELECT
                branch,
                COUNT(*) AS total_students,
                ROUND(AVG(marks), 2) AS average_marks,
                ROUND(AVG(attendance), 2) AS average_attendance
            FROM students
            GROUP BY branch
            ORDER BY branch
        """)
        branch_data = cursor.fetchall()

        cursor.close()
        connection.close()

        return {
            "summary": summary,
            "branch_data": branch_data
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))