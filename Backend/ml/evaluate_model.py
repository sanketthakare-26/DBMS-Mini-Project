"""
Model Evaluation and Cross-Validation utilities
"""

from typing import Dict, Any
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)
from sklearn.model_selection import StratifiedKFold, cross_validate


def evaluate_model(model, X_test, y_test) -> Dict[str, Any]:
    """Calculate key classification evaluation metrics on the holdout test set."""
    y_pred = model.predict(X_test)

    # Calculate probabilities for ROC-AUC
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)[:, 1]
        auc = float(roc_auc_score(y_test, y_prob))
    else:
        auc = 0.0

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred).tolist()

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(auc, 4),
        "confusion_matrix": cm,
        "classification_report": classification_report(y_test, y_pred, output_dict=True, zero_division=0),
    }


def cross_validate_model(pipeline, X_train, y_train, n_splits: int = 5) -> Dict[str, Any]:
    """Run Stratified 5-Fold Cross Validation and report mean & std metrics."""
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    scoring = {
        "accuracy": "accuracy",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
        "roc_auc": "roc_auc",
    }

    scores = cross_validate(pipeline, X_train, y_train, cv=skf, scoring=scoring)

    return {
        "cv_folds": n_splits,
        "accuracy_mean": round(float(np.mean(scores["test_accuracy"])), 4),
        "accuracy_std": round(float(np.std(scores["test_accuracy"])), 4),
        "precision_mean": round(float(np.mean(scores["test_precision"])), 4),
        "recall_mean": round(float(np.mean(scores["test_recall"])), 4),
        "f1_mean": round(float(np.mean(scores["test_f1"])), 4),
        "f1_std": round(float(np.std(scores["test_f1"])), 4),
        "roc_auc_mean": round(float(np.mean(scores["test_roc_auc"])), 4),
        "roc_auc_std": round(float(np.std(scores["test_roc_auc"])), 4),
    }
