from fastapi import APIRouter, HTTPException, Query, status
from services.customer_service import list_activity_logs

router = APIRouter(prefix="/api/activity", tags=["Activity Logs"])


@router.get("", status_code=status.HTTP_200_OK)
def get_activity_feed(
    limit: int = Query(50, ge=1, le=200)
):
    """Retrieve audit activity log records written by database triggers."""
    try:
        return list_activity_logs(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch activity logs: {str(e)}")
