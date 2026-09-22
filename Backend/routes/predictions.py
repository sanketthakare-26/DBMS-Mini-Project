from typing import List
from fastapi import APIRouter, HTTPException, Query, status
from database import get_db_cursor
from services.analytics_service import list_predictions, get_high_risk_customers

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])


@router.get("", status_code=status.HTTP_200_OK)
def get_predictions_history(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """List recent predictions from database."""
    try:
        return list_predictions(limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch predictions: {str(e)}")


@router.get("/high-risk", status_code=status.HTTP_200_OK)
def get_high_risk():
    """Executes get_high_risk_customers stored procedure."""
    try:
        return get_high_risk_customers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute high-risk procedure: {str(e)}")


@router.get("/{customer_id}", status_code=status.HTTP_200_OK)
def get_customer_prediction_history(customer_id: int):
    """Retrieve full chronological prediction history for a specific customer."""
    try:
        with get_db_cursor(dictionary=True) as cur:
            cur.execute("""
                SELECT 
                    prediction_id,
                    customer_id,
                    churn_probability,
                    risk_level,
                    model_name,
                    prediction_date
                FROM predictions
                WHERE customer_id = %s
                ORDER BY prediction_date DESC
            """, (customer_id,))
            rows = cur.fetchall()

        return rows
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch customer prediction history: {str(e)}"
        )
