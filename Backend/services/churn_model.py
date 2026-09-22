"""
Prediction Service for Customer Churn ML Engine
Integrates Scikit-learn Pipeline with MySQL predictions table.
"""

import os
import json
from datetime import datetime
from typing import Dict, Any, Tuple, Optional, List
import joblib
import pandas as pd
import numpy as np

from database import get_db_cursor
from ml.preprocessing import ALL_FEATURE_NAMES

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml", "models"))
MODEL_PATH = os.path.join(MODEL_DIR, "churn_model.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "model_metrics.json")

# ========================================================
# CONFIGURABLE RISK THRESHOLDS
# Centralized definition — do NOT duplicate in other files!
# ========================================================
RISK_THRESHOLDS = {
    "LOW_MAX": 0.30,      # 0.00 - 0.30 -> LOW
    "MEDIUM_MAX": 0.60,   # 0.31 - 0.60 -> MEDIUM
    # > 0.60 -> HIGH
}

# In-memory cached model
_cached_pipeline = None


def get_risk_level(probability: float) -> str:
    """
    Classify probability into risk tier based on centralized thresholds:
    0% - 30%   -> LOW
    31% - 60%  -> MEDIUM
    61% - 100% -> HIGH
    """
    if probability <= RISK_THRESHOLDS["LOW_MAX"]:
        return "Low"
    elif probability <= RISK_THRESHOLDS["MEDIUM_MAX"]:
        return "Medium"
    else:
        return "High"


def load_model():
    """Load the trained ML pipeline from disk, caching it in memory."""
    global _cached_pipeline
    if _cached_pipeline is not None:
        return _cached_pipeline

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Trained ML model pipeline not found at {MODEL_PATH}. "
            "Please run 'python Backend/ml/train_model.py' to train and export the model."
        )

    try:
        _cached_pipeline = joblib.load(MODEL_PATH)
        return _cached_pipeline
    except Exception as e:
        raise RuntimeError(f"Failed to load ML model pipeline: {str(e)}")


def get_model_metrics() -> Dict[str, Any]:
    """Retrieve saved evaluation metrics and metadata."""
    if not os.path.exists(METRICS_PATH):
        raise FileNotFoundError(
            f"Model metrics not found at {METRICS_PATH}. "
            "Please train the model first using 'python Backend/ml/train_model.py'."
        )

    with open(METRICS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def prepare_features(data: Any) -> pd.DataFrame:
    """
    Convert dictionary or existing DataFrame into a clean Pandas DataFrame
    with exact columns expected by the preprocessing pipeline.
    """
    if isinstance(data, dict):
        df = pd.DataFrame([data])
    elif isinstance(data, pd.DataFrame):
        df = data.copy()
    else:
        raise ValueError("Features input must be a dictionary or a Pandas DataFrame.")

    # Ensure all required features are present
    for col in ALL_FEATURE_NAMES:
        if col not in df.columns:
            # Provide neutral academic defaults if missing
            if col in ["gender"]:
                df[col] = "Male"
            elif col in ["plan_name"]:
                df[col] = "Standard"
            elif col in ["billing_cycle"]:
                df[col] = "Monthly"
            else:
                df[col] = 0.0

    return df[ALL_FEATURE_NAMES]


def predict_churn(features_data: Any) -> Tuple[float, str]:
    """
    Run inference on feature data.
    Returns: (churn_probability: float between 0.00 and 1.00, risk_level: str)
    """
    model = load_model()
    df_features = prepare_features(features_data)

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(df_features)[:, 1]
        prob = float(probs[0])
    else:
        preds = model.predict(df_features)
        prob = float(preds[0])

    prob = round(max(0.0, min(1.0, prob)), 4)
    risk = get_risk_level(prob)
    return prob, risk


def save_prediction_record(
    customer_id: int,
    probability: float,
    risk_level: str,
    model_name: str
) -> int:
    """
    Save prediction directly into MySQL predictions table.
    Database trigger trg_prediction_after_insert will log this in activity_logs.
    """
    with get_db_cursor(commit=True) as cur:
        cur.execute("""
            INSERT INTO predictions (customer_id, churn_probability, risk_level, model_name, prediction_date)
            VALUES (%s, %s, %s, %s, NOW())
        """, (customer_id, probability, risk_level, model_name))
        return cur.lastrowid


def predict_customer_by_id(customer_id: int) -> Dict[str, Any]:
    """
    Fetch customer features from MySQL customer_churn_view,
    compute churn probability and risk tier, save to predictions table,
    and return structured result.
    """
    with get_db_cursor(dictionary=True) as cur:
        cur.execute("SELECT * FROM customer_churn_view WHERE customer_id = %s", (customer_id,))
        customer_row = cur.fetchone()

    if not customer_row:
        raise ValueError(f"Customer with ID {customer_id} not found in database.")

    prob, risk = predict_churn(customer_row)
    metrics = get_model_metrics()
    model_name = metrics.get("model_name", "ChurnPredictor-ML-v1")

    # Persist prediction in MySQL
    pred_id = save_prediction_record(customer_id, prob, risk, model_name)

    return {
        "prediction_id": pred_id,
        "customer_id": customer_id,
        "customer_code": customer_row.get("customer_code"),
        "name": customer_row.get("name"),
        "churn_probability": prob,
        "risk_level": risk,
        "model_name": model_name,
        "prediction_date": datetime.now().isoformat()
    }


def batch_predict_all_customers() -> Dict[str, Any]:
    """
    Run batch prediction for all customers in customer_churn_view:
    1. Load all customer features
    2. Vectorized prediction via Scikit-learn Pipeline
    3. Bulk save into predictions table
    4. Return summary breakdown
    """
    model = load_model()
    metrics = get_model_metrics()
    model_name = metrics.get("model_name", "ChurnPredictor-ML-v1")

    with get_db_cursor(dictionary=True) as cur:
        cur.execute("SELECT * FROM customer_churn_view")
        rows = cur.fetchall()

    if not rows:
        raise ValueError("No customer records found in database to predict.")

    df_all = pd.DataFrame(rows)
    df_features = prepare_features(df_all)

    # Vectorized inference
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(df_features)[:, 1]
    else:
        probs = model.predict(df_features).astype(float)

    probs = np.clip(probs, 0.0, 1.0)

    low_count = 0
    med_count = 0
    high_count = 0
    insert_records = []

    for i, row in df_all.iterrows():
        prob = round(float(probs[i]), 4)
        risk = get_risk_level(prob)
        if risk == "Low":
            low_count += 1
        elif risk == "Medium":
            med_count += 1
        else:
            high_count += 1

        insert_records.append((int(row["customer_id"]), prob, risk, model_name))

    # Bulk insert into predictions table
    with get_db_cursor(commit=True) as cur:
        cur.executemany("""
            INSERT INTO predictions (customer_id, churn_probability, risk_level, model_name, prediction_date)
            VALUES (%s, %s, %s, %s, NOW())
        """, insert_records)

    avg_prob = round(float(np.mean(probs)), 4)

    return {
        "total_processed": len(rows),
        "low_risk": low_count,
        "medium_risk": med_count,
        "high_risk": high_count,
        "average_churn_probability": avg_prob,
        "model_name": model_name,
        "execution_date": datetime.now().isoformat()
    }
