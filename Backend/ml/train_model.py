"""
Model Training, Comparison, Cross-Validation, and Export Pipeline
AI-Based Customer Churn Prediction Engine (Phase 2)
"""

import os
import sys
import json
from datetime import datetime
import joblib
import pandas as pd
import numpy as np

# Ensure Backend root is in path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

from database import get_database_connection
from ml.preprocessing import (
    get_preprocessor,
    get_transformed_feature_names,
    ALL_FEATURE_NAMES,
    TARGET_COLUMN,
)
from ml.evaluate_model import evaluate_model, cross_validate_model

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODELS_DIR, "churn_model.pkl")
METRICS_PATH = os.path.join(MODELS_DIR, "model_metrics.json")


def fetch_dataset_from_mysql() -> pd.DataFrame:
    """Fetch training data directly from MySQL customer_churn_view."""
    print("Connecting to MySQL to fetch dataset from customer_churn_view...")
    conn = get_database_connection()
    query = """
        SELECT 
            age,
            gender,
            plan_name,
            billing_cycle,
            monthly_charge,
            subscription_months,
            monthly_logins,
            usage_hours,
            monthly_sessions,
            transactions_count,
            payment_delays,
            failed_payments,
            complaint_count,
            support_tickets,
            average_resolution_days,
            satisfaction_score,
            churn
        FROM customer_churn_view;
    """
    df = pd.read_sql(query, conn)
    conn.close()
    print(f"Loaded {len(df)} records from customer_churn_view.")

    if len(df) < 50:
        raise ValueError(f"Insufficient training data: only {len(df)} records found in customer_churn_view.")

    return df


def train_and_compare_models():
    """Train 4 models, perform cross-validation, compare metrics, and save the best pipeline."""
    os.makedirs(MODELS_DIR, exist_ok=True)

    # 1. Fetch data
    df = fetch_dataset_from_mysql()

    X = df[ALL_FEATURE_NAMES]
    y = df[TARGET_COLUMN].astype(int)

    churn_rate = (y.sum() / len(y)) * 100
    print(f"Dataset Shape: {X.shape}, Target Distribution: {y.sum()} churned ({churn_rate:.1f}%), {len(y) - y.sum()} retained")

    # 2. Train / Test Split with Stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")

    # 3. Model Candidates
    candidates = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=6, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=120, max_depth=8, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=120, learning_rate=0.08, max_depth=4, random_state=42),
    }

    comparison_results = []
    trained_pipelines = {}
    cv_results = {}

    print("\n========================================================")
    print("TRAINING & CROSS-VALIDATION (5-FOLD STRATIFIED)")
    print("========================================================")

    for name, clf in candidates.items():
        print(f"\nTraining [{name}]...")
        preprocessor = get_preprocessor()
        pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", clf)])

        # 5-Fold Stratified Cross Validation on Train Set
        cv_scores = cross_validate_model(pipeline, X_train, y_train, n_splits=5)
        cv_results[name] = cv_scores

        # Fit on full training set
        pipeline.fit(X_train, y_train)
        trained_pipelines[name] = pipeline

        # Evaluate on holdout test set
        test_metrics = evaluate_model(pipeline, X_test, y_test)

        result_entry = {
            "model_name": name,
            "test_accuracy": test_metrics["accuracy"],
            "test_precision": test_metrics["precision"],
            "test_recall": test_metrics["recall"],
            "test_f1": test_metrics["f1"],
            "test_roc_auc": test_metrics["roc_auc"],
            "cv_accuracy_mean": cv_scores["accuracy_mean"],
            "cv_f1_mean": cv_scores["f1_mean"],
            "cv_roc_auc_mean": cv_scores["roc_auc_mean"],
            "full_test_metrics": test_metrics,
        }
        comparison_results.append(result_entry)

    # 4. Display Comparison Table
    print("\n==========================================================================================")
    print("MODEL EVALUATION & BENCHMARK COMPARISON TABLE")
    print("==========================================================================================")
    print(f"{'Model':<22} | {'Accuracy':<8} | {'Precision':<9} | {'Recall':<8} | {'F1':<8} | {'ROC-AUC':<8} | {'CV ROC-AUC':<10}")
    print("-" * 90)
    for r in comparison_results:
        print(
            f"{r['model_name']:<22} | "
            f"{r['test_accuracy']:<8.4f} | "
            f"{r['test_precision']:<9.4f} | "
            f"{r['test_recall']:<8.4f} | "
            f"{r['test_f1']:<8.4f} | "
            f"{r['test_roc_auc']:<8.4f} | "
            f"{r['cv_roc_auc_mean']:<10.4f}"
        )
    print("==========================================================================================")

    # 5. Select Winning Model based on ROC-AUC and F1
    best_candidate = max(comparison_results, key=lambda x: (x["test_roc_auc"], x["test_f1"]))
    best_name = best_candidate["model_name"]
    best_pipeline = trained_pipelines[best_name]

    print(f"\nWINNING MODEL SELECTED: [{best_name}]")
    print(f"Test ROC-AUC: {best_candidate['test_roc_auc']}, Test F1: {best_candidate['test_f1']}")

    # 6. Extract Feature Importance
    feature_importances = []
    try:
        fitted_preprocessor = best_pipeline.named_steps["preprocessor"]
        feature_names = get_transformed_feature_names(fitted_preprocessor)
        fitted_clf = best_pipeline.named_steps["classifier"]

        if hasattr(fitted_clf, "feature_importances_"):
            importances = fitted_clf.feature_importances_
            fi_pairs = [
                {"feature": fn, "importance": round(float(imp), 4)}
                for fn, imp in zip(feature_names, importances)
            ]
            feature_importances = sorted(fi_pairs, key=lambda x: x["importance"], reverse=True)
        elif hasattr(fitted_clf, "coef_"):
            coefs = np.abs(fitted_clf.coef_[0])
            # Normalize coefficients to sum to 1 for intuitive comparison
            total_coef = np.sum(coefs) if np.sum(coefs) > 0 else 1.0
            fi_pairs = [
                {"feature": fn, "importance": round(float(imp / total_coef), 4)}
                for fn, imp in zip(feature_names, coefs)
            ]
            feature_importances = sorted(fi_pairs, key=lambda x: x["importance"], reverse=True)

        # Also extract Random Forest feature importances specifically if another model was chosen
        rf_pipeline = trained_pipelines.get("Random Forest")
        if rf_pipeline and not hasattr(fitted_clf, "feature_importances_"):
            rf_clf = rf_pipeline.named_steps["classifier"]
            if hasattr(rf_clf, "feature_importances_"):
                rf_fi = [
                    {"feature": fn, "importance": round(float(imp), 4)}
                    for fn, imp in zip(feature_names, rf_clf.feature_importances_)
                ]
                rf_feature_importances = sorted(rf_fi, key=lambda x: x["importance"], reverse=True)
            else:
                rf_feature_importances = feature_importances
        else:
            rf_feature_importances = feature_importances
    except Exception as err:
        print("Warning: Could not compute feature importances:", err)
        rf_feature_importances = []

    if feature_importances:
        print("\nTOP 8 PREDICTIVE FEATURES:")
        for fi in feature_importances[:8]:
            print(f"  - {fi['feature']:<30}: {fi['importance']:.4f}")

    # 7. Serialize Best Pipeline & Metrics
    joblib.dump(best_pipeline, MODEL_PATH)
    print(f"\nTrained pipeline saved to: {MODEL_PATH}")

    metrics_payload = {
        "model_name": best_name,
        "model_type": type(best_pipeline.named_steps["classifier"]).__name__,
        "training_date": datetime.now().isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "total_dataset_samples": len(df),
        "features_used": ALL_FEATURE_NAMES,
        "metrics": {
            "accuracy": best_candidate["test_accuracy"],
            "precision": best_candidate["test_precision"],
            "recall": best_candidate["test_recall"],
            "f1": best_candidate["test_f1"],
            "roc_auc": best_candidate["test_roc_auc"],
            "confusion_matrix": best_candidate["full_test_metrics"]["confusion_matrix"],
        },
        "cross_validation": cv_results[best_name],
        "model_comparison": [
            {
                "model_name": c["model_name"],
                "accuracy": c["test_accuracy"],
                "precision": c["test_precision"],
                "recall": c["test_recall"],
                "f1": c["test_f1"],
                "roc_auc": c["test_roc_auc"],
                "cv_roc_auc": c["cv_roc_auc_mean"],
                "cv_f1": c["cv_f1_mean"],
            }
            for c in comparison_results
        ],
        "feature_importances": feature_importances,
        "tree_feature_importances": rf_feature_importances,
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"Model evaluation metrics saved to: {METRICS_PATH}")

    return best_name, best_pipeline, metrics_payload


if __name__ == "__main__":
    train_and_compare_models()
