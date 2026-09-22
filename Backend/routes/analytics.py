from fastapi import APIRouter, HTTPException, status
from services.analytics_service import (
    get_overview_analytics,
    get_churn_analytics,
    get_subscription_churn_summary,
    get_payment_behavior_summary,
    get_complaint_churn_summary,
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview", status_code=status.HTTP_200_OK)
def analytics_overview():
    """Returns top-level business and churn KPI summary."""
    try:
        return get_overview_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch overview analytics: {str(e)}")


@router.get("/churn", status_code=status.HTTP_200_OK)
def analytics_churn():
    """Returns granular demographic and plan churn insights from customer_churn_view."""
    try:
        return get_churn_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch churn analytics: {str(e)}")


@router.get("/subscriptions", status_code=status.HTTP_200_OK)
def analytics_subscriptions():
    """Returns aggregated subscription performance from subscription_churn_summary view."""
    try:
        return get_subscription_churn_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch subscription summary: {str(e)}")


@router.get("/payments", status_code=status.HTTP_200_OK)
def analytics_payments():
    """Returns payment methods and delinquency insights from payment_behavior_summary view."""
    try:
        return get_payment_behavior_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment summary: {str(e)}")


@router.get("/complaints", status_code=status.HTTP_200_OK)
def analytics_complaints():
    """Returns support tickets & satisfaction tiers from complaint_churn_summary view."""
    try:
        return get_complaint_churn_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch complaint summary: {str(e)}")
