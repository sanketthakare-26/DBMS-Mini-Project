from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field


# ========================================================
# CUSTOMER SCHEMAS
# ========================================================

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=18, le=120)
    gender: str = Field(..., max_length=20)
    location: str = Field(..., max_length=100)


class CustomerCreate(CustomerBase):
    customer_code: Optional[str] = Field(None, max_length=20)
    registration_date: Optional[date] = None
    # Optional initial related records
    plan_name: Optional[str] = "Standard"
    billing_cycle: Optional[str] = "Monthly"
    monthly_charge: Optional[float] = 49.99
    payment_method: Optional[str] = "Credit Card"


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=18, le=120)
    gender: Optional[str] = Field(None, max_length=20)
    location: Optional[str] = Field(None, max_length=100)
    plan_name: Optional[str] = None
    billing_cycle: Optional[str] = None
    monthly_charge: Optional[float] = None


class CustomerResponse(CustomerBase):
    customer_id: int
    customer_code: str
    registration_date: Optional[date] = None
    created_at: Optional[datetime] = None


# ========================================================
# SUBSCRIPTION SCHEMAS
# ========================================================

class SubscriptionResponse(BaseModel):
    subscription_id: int
    customer_id: int
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    plan_name: str
    billing_cycle: str
    monthly_charge: float
    subscription_start: date
    subscription_months: int
    renewal_status: str


# ========================================================
# USAGE SCHEMAS
# ========================================================

class UsageResponse(BaseModel):
    usage_id: int
    customer_id: int
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    monthly_logins: int
    usage_hours: float
    monthly_sessions: int
    transactions_count: int
    last_login: Optional[date] = None


# ========================================================
# PAYMENT SCHEMAS
# ========================================================

class PaymentResponse(BaseModel):
    payment_id: int
    customer_id: int
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    monthly_payment: float
    total_payment: float
    payment_delays: int
    failed_payments: int
    payment_method: str
    last_payment_date: Optional[date] = None


# ========================================================
# COMPLAINT SCHEMAS
# ========================================================

class ComplaintResponse(BaseModel):
    complaint_id: int
    customer_id: int
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    complaint_count: int
    support_tickets: int
    average_resolution_days: float
    satisfaction_score: float
    last_complaint_date: Optional[date] = None


# ========================================================
# PREDICTION SCHEMAS
# ========================================================

class PredictionResponse(BaseModel):
    prediction_id: int
    customer_id: int
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    churn_probability: float
    risk_level: str
    model_name: str
    prediction_date: datetime


# ========================================================
# FULL CUSTOMER PROFILE SCHEMA
# ========================================================

class CustomerProfileResponse(BaseModel):
    customer_id: int
    customer_code: str
    name: str
    age: int
    gender: str
    location: str
    registration_date: Optional[date] = None
    created_at: Optional[datetime] = None
    # Subscriptions
    subscription_id: Optional[int] = None
    plan_name: Optional[str] = None
    billing_cycle: Optional[str] = None
    monthly_charge: Optional[float] = None
    subscription_start: Optional[date] = None
    subscription_months: Optional[int] = None
    renewal_status: Optional[str] = None
    # Usage
    usage_id: Optional[int] = None
    monthly_logins: Optional[int] = None
    usage_hours: Optional[float] = None
    monthly_sessions: Optional[int] = None
    transactions_count: Optional[int] = None
    last_login: Optional[date] = None
    # Payments
    payment_id: Optional[int] = None
    monthly_payment: Optional[float] = None
    total_payment: Optional[float] = None
    payment_delays: Optional[int] = None
    failed_payments: Optional[int] = None
    payment_method: Optional[str] = None
    last_payment_date: Optional[date] = None
    # Complaints
    complaint_id: Optional[int] = None
    complaint_count: Optional[int] = None
    support_tickets: Optional[int] = None
    average_resolution_days: Optional[float] = None
    satisfaction_score: Optional[float] = None
    last_complaint_date: Optional[date] = None
    # Churn Label
    churn: Optional[int] = 0
    churn_date: Optional[date] = None
    # Latest Prediction
    prediction_id: Optional[int] = None
    churn_probability: Optional[float] = None
    risk_level: Optional[str] = None
    model_name: Optional[str] = None
    prediction_date: Optional[datetime] = None


# ========================================================
# ACTIVITY LOG SCHEMA
# ========================================================

class ActivityLogResponse(BaseModel):
    activity_id: int
    action_type: str
    table_name: str
    record_id: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime
