from fastapi import APIRouter, HTTPException, Query, status
from services.customer_service import list_subscriptions

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])


@router.get("", status_code=status.HTTP_200_OK)
def get_subscriptions(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    try:
        return list_subscriptions(limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
