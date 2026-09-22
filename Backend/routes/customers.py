from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from models.schemas import CustomerCreate, CustomerUpdate, CustomerProfileResponse
from services.customer_service import (
    list_customers,
    get_customer_by_id,
    create_customer,
    update_customer,
    delete_customer,
    get_customer_full_profile,
)

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("", status_code=status.HTTP_200_OK)
def get_all_customers(
    search: Optional[str] = Query(None, description="Search by name or code"),
    location: Optional[str] = Query(None, description="Filter by location"),
    plan_name: Optional[str] = Query(None, description="Filter by plan name"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    try:
        return list_customers(
            search=search,
            location=location,
            plan_name=plan_name,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")


@router.get("/{customer_id}", status_code=status.HTTP_200_OK)
def get_single_customer(customer_id: int):
    try:
        customer = get_customer_by_id(customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} not found"
            )
        return customer
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")


@router.post("", status_code=status.HTTP_201_CREATED)
def add_customer(payload: CustomerCreate):
    try:
        result = create_customer(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create customer: {str(e)}")


@router.put("/{customer_id}", status_code=status.HTTP_200_OK)
def modify_customer(customer_id: int, payload: CustomerUpdate):
    try:
        # Check customer existence
        existing = get_customer_by_id(customer_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} not found"
            )
        updated = update_customer(customer_id, payload)
        if not updated:
            return {"message": "No fields changed", "customer_id": customer_id}
        return {"message": "Customer updated successfully", "customer_id": customer_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update customer: {str(e)}")


@router.delete("/{customer_id}", status_code=status.HTTP_200_OK)
def remove_customer(customer_id: int):
    try:
        existing = get_customer_by_id(customer_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} not found"
            )
        delete_customer(customer_id)
        return {"message": "Customer deleted successfully", "customer_id": customer_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete customer: {str(e)}")


@router.get("/{customer_id}/profile", response_model=CustomerProfileResponse)
def get_customer_profile(customer_id: int):
    """Executes get_customer_full_profile stored procedure for a 360-degree customer view."""
    try:
        profile = get_customer_full_profile(customer_id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer profile for ID {customer_id} not found"
            )
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving customer profile: {str(e)}")
