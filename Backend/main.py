from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from database import get_database_connection

# Import modular routers
from routes.customers import router as customers_router
from routes.subscriptions import router as subscriptions_router
from routes.usage import router as usage_router
from routes.payments import router as payments_router
from routes.complaints import router as complaints_router
from routes.analytics import router as analytics_router
from routes.predictions import router as predictions_router
from routes.predict import router as predict_router
from routes.model import router as model_router
from routes.activity import router as activity_router
from routes.schema import router as schema_router

# =============================================================================
# CREATE FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="AI-Based Customer Churn Prediction & Analytics API",
    description="Backend API powering Customer Churn Analytics, MySQL Relational Database, and Machine Learning Prediction Engine",
    version="2.0.0"
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
# ATTACH ROUTERS
# =============================================================================

app.include_router(customers_router)
app.include_router(subscriptions_router)
app.include_router(usage_router)
app.include_router(payments_router)
app.include_router(complaints_router)
app.include_router(analytics_router)
app.include_router(predictions_router)
app.include_router(predict_router)
app.include_router(model_router)
app.include_router(activity_router)
app.include_router(schema_router)

# =============================================================================
# ROOT & SYSTEM HEALTH ENDPOINTS
# =============================================================================

@app.get("/", status_code=status.HTTP_200_OK)
def root():
    return {
        "system": "AI-Based Customer Churn Prediction & Customer Analytics System",
        "version": "2.0.0",
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/api/test-db", status_code=status.HTTP_200_OK)
def test_database():
    """Verify live connection to MySQL churn_prediction database."""
    conn = None
    cur = None
    try:
        conn = get_database_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT DATABASE() AS current_database, @@version AS mysql_version")
        db_info = cur.fetchone()

        cur.execute("SELECT COUNT(*) AS total_customers FROM customers")
        stats = cur.fetchone()

        return {
            "status": "connected",
            "database": db_info.get("current_database"),
            "mysql_version": db_info.get("mysql_version"),
            "total_customers": stats.get("total_customers", 0),
            "message": "MySQL churn_prediction database connection is active and operational"
        }
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(error)}"
        )
    finally:
        if cur:
            try:
                cur.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass