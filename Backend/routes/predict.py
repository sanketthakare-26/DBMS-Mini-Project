from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from datetime import datetime

from services.churn_model import (
    predict_customer_by_id,
    predict_churn,
    save_prediction_record,
    get_model_metrics,
    batch_predict_all_customers,
)

router = APIRouter(prefix="/api", tags=["Machine Learning Inference"])


class PredictionRequest(BaseModel):
    customer_id: Optional[int] = Field(None, description="ID of existing customer in DB to predict")
    age: Optional[int] = Field(None, ge=18, le=120)
    gender: Optional[str] = "Male"
    plan_name: Optional[str] = "Standard"
    billing_cycle: Optional[str] = "Monthly"
    monthly_charge: Optional[float] = 49.99
    subscription_months: Optional[int] = 12
    monthly_logins: Optional[int] = 25
    usage_hours: Optional[float] = 30.0
    monthly_sessions: Optional[int] = 40
    transactions_count: Optional[int] = 10
    payment_delays: Optional[int] = 0
    failed_payments: Optional[int] = 0
    complaint_count: Optional[int] = 0
    support_tickets: Optional[int] = 0
    average_resolution_days: Optional[float] = 1.5
    satisfaction_score: Optional[float] = 4.5


class PredictionResponse(BaseModel):
    customer_id: Optional[int] = None
    churn_probability: float
    risk_level: str
    model_name: str
    prediction_date: str


@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
def predict_single_customer(payload: PredictionRequest):
    """
    Predict churn probability and risk tier for a customer.
    If customer_id is provided without all features, fetches actual features from customer_churn_view.
    Saves prediction record into MySQL predictions table.
    """
    try:
        # Case A: If customer_id provided, fetch and predict from database
        if payload.customer_id is not None and payload.age is None:
            result = predict_customer_by_id(payload.customer_id)
            return result

        # Case B: Predict from direct feature payload
        feature_dict = payload.model_dump()
        customer_id = feature_dict.pop("customer_id", None) or 0

        prob, risk = predict_churn(feature_dict)
        metrics = get_model_metrics()
        model_name = metrics.get("model_name", "ChurnPredictor-ML-v1")

        # Save to DB if customer_id > 0
        if customer_id and customer_id > 0:
            save_prediction_record(customer_id, prob, risk, model_name)

        return {
            "customer_id": customer_id if customer_id > 0 else None,
            "churn_probability": prob,
            "risk_level": risk,
            "model_name": model_name,
            "prediction_date": datetime.now().isoformat()
        }

    except FileNotFoundError as fnf:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Prediction error: {str(e)}")


@router.post("/predictions/run-all", status_code=status.HTTP_200_OK)
def run_batch_predictions():
    """
    Run batch ML inference on all customers in the database.
    Calculates churn probabilities, classifies risk levels,
    persists new predictions in MySQL, and returns summary stats.
    """
    try:
        summary = batch_predict_all_customers()
        return summary
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Batch prediction error: {str(e)}")
