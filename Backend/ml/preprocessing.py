"""
ML Preprocessing Pipeline for Customer Churn Prediction
"""

from typing import List
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

# Numerical features
NUMERICAL_FEATURES: List[str] = [
    "age",
    "monthly_charge",
    "subscription_months",
    "monthly_logins",
    "usage_hours",
    "monthly_sessions",
    "transactions_count",
    "payment_delays",
    "failed_payments",
    "complaint_count",
    "support_tickets",
    "average_resolution_days",
    "satisfaction_score",
]

# Categorical features
CATEGORICAL_FEATURES: List[str] = [
    "gender",
    "plan_name",
    "billing_cycle",
]

ALL_FEATURE_NAMES: List[str] = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN: str = "churn"


def get_preprocessor() -> ColumnTransformer:
    """
    Build a robust Scikit-learn ColumnTransformer:
    - Numerical: Median Imputer + StandardScaler
    - Categorical: Most-frequent Imputer + OneHotEncoder (handle_unknown='ignore')
    """
    numerical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numerical_pipeline, NUMERICAL_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )

    return preprocessor


def get_transformed_feature_names(fitted_preprocessor: ColumnTransformer) -> List[str]:
    """Retrieve all feature names after numerical scaling and one-hot encoding."""
    feature_names = []
    # 1. Numerical feature names
    feature_names.extend(NUMERICAL_FEATURES)

    # 2. Categorical feature names after OneHotEncoder
    try:
        cat_transformer = fitted_preprocessor.named_transformers_["cat"]
        onehot_step = cat_transformer.named_steps["onehot"]
        encoded_cats = onehot_step.get_feature_names_out(CATEGORICAL_FEATURES)
        feature_names.extend(list(encoded_cats))
    except Exception:
        pass

    return feature_names
