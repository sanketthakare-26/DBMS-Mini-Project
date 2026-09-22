from fastapi import APIRouter, HTTPException, Query, status
from services.customer_service import list_complaints

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


@router.get("", status_code=status.HTTP_200_OK)
def get_complaints(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    try:
        return list_complaints(limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
