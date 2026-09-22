from fastapi import APIRouter, HTTPException
from database import get_db_cursor

router = APIRouter(prefix="/api/database", tags=["Database Schema"])

TABLES_LIST = [
    "customers",
    "subscriptions",
    "usage",
    "payments",
    "complaints",
    "churn_labels",
    "predictions",
    "activity_logs"
]

@router.get("/tables")
def get_all_tables_info():
    """
    Returns live structure, column types, row counts, and sample data for all tables.
    """
    tables_data = []
    
    with get_db_cursor() as cursor:
        for tbl in TABLES_LIST:
            try:
                # 1. Row count
                cursor.execute(f"SELECT COUNT(*) as count FROM `{tbl}`")
                count_res = cursor.fetchone()
                row_count = count_res['count'] if count_res else 0
                
                # 2. Columns via DESCRIBE
                cursor.execute(f"DESCRIBE `{tbl}`")
                columns = cursor.fetchall()
                
                # 3. SHOW CREATE TABLE
                cursor.execute(f"SHOW CREATE TABLE `{tbl}`")
                create_res = cursor.fetchone()
                create_sql = create_res.get('Create Table', '') if create_res else ''
                
                # 4. Sample data (up to 5 rows)
                cursor.execute(f"SELECT * FROM `{tbl}` ORDER BY 1 DESC LIMIT 5")
                sample_rows = cursor.fetchall()
                
                # Convert dates/timestamps/decimals for clean JSON serialization
                for row in sample_rows:
                    for k, v in row.items():
                        if hasattr(v, 'isoformat'):
                            row[k] = v.isoformat()
                        elif hasattr(v, '__float__'):
                            row[k] = float(v)
                
                tables_data.append({
                    "table_name": tbl,
                    "row_count": row_count,
                    "columns": columns,
                    "create_sql": create_sql,
                    "sample_rows": sample_rows
                })
            except Exception as e:
                tables_data.append({
                    "table_name": tbl,
                    "row_count": 0,
                    "columns": [],
                    "create_sql": f"-- Error reading table {tbl}: {str(e)}",
                    "sample_rows": []
                })
                
    return tables_data


@router.get("/triggers")
def get_triggers_info():
    """
    Returns live trigger metadata and status from MySQL.
    """
    with get_db_cursor() as cursor:
        cursor.execute("SHOW TRIGGERS FROM `churn_prediction`")
        triggers = cursor.fetchall()
        for t in triggers:
            if 'Created' in t and hasattr(t['Created'], 'isoformat'):
                t['Created'] = t['Created'].isoformat()
        return triggers


@router.get("/procedures")
def get_procedures_info():
    """
    Returns stored procedures status from MySQL.
    """
    with get_db_cursor() as cursor:
        cursor.execute("SHOW PROCEDURE STATUS WHERE Db = 'churn_prediction'")
        procs = cursor.fetchall()
        for p in procs:
            for k, v in p.items():
                if hasattr(v, 'isoformat'):
                    p[k] = v.isoformat()
        return procs


@router.get("/views")
def get_views_info():
    """
    Returns views list and status from MySQL information_schema.
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT TABLE_NAME, VIEW_DEFINITION, CHECK_OPTION, IS_UPDATABLE 
            FROM information_schema.VIEWS 
            WHERE TABLE_SCHEMA = 'churn_prediction'
        """)
        views = cursor.fetchall()
        return views
