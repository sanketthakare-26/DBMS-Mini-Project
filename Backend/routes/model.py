from fastapi import APIRouter, HTTPException, status
from services.churn_model import get_model_metrics

router = APIRouter(prefix="/api/model", tags=["Model Metadata & Explainability"])


@router.get("/info", status_code=status.HTTP_200_OK)
def get_model_info():
    """
    Returns trained model information, training timestamp, sample sizes,
    features used, evaluation metrics (Accuracy, Precision, Recall, F1, ROC-AUC),
    cross-validation results, and multi-model benchmark comparison.
    """
    try:
        metrics = get_model_metrics()
        return {
            "model_name": metrics.get("model_name"),
            "model_type": metrics.get("model_type"),
            "training_date": metrics.get("training_date"),
            "training_samples": metrics.get("training_samples"),
            "test_samples": metrics.get("test_samples"),
            "features_used": metrics.get("features_used", []),
            "accuracy": metrics.get("metrics", {}).get("accuracy"),
            "precision": metrics.get("metrics", {}).get("precision"),
            "recall": metrics.get("metrics", {}).get("recall"),
            "f1": metrics.get("metrics", {}).get("f1"),
            "roc_auc": metrics.get("metrics", {}).get("roc_auc"),
            "cross_validation": metrics.get("cross_validation"),
            "model_comparison": metrics.get("model_comparison", []),
        }
    except FileNotFoundError as fnf:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model info not available: {str(fnf)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch model info: {str(e)}")


@router.get("/feature-importance", status_code=status.HTTP_200_OK)
def get_feature_importance():
    """
    Returns ranked feature importance scores for model explainability.
    """
    try:
        metrics = get_model_metrics()
        # Fall back to tree_feature_importances or feature_importances
        fi = metrics.get("tree_feature_importances") or metrics.get("feature_importances", [])
        return fi
    except FileNotFoundError as fnf:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Feature importance not available: {str(fnf)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch feature importance: {str(e)}")
