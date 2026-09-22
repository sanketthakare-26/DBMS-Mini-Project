from typing import List, Optional, Dict, Any
from datetime import date
from database import get_db_cursor
from models.schemas import CustomerCreate, CustomerUpdate


def list_customers(
    search: Optional[str] = None,
    location: Optional[str] = None,
    plan_name: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """Fetch paginated customer records with optional filters and join plan info."""
    conditions = []
    params = []

    sql = """
        SELECT 
            c.customer_id,
            c.customer_code,
            c.name,
            c.age,
            c.gender,
            c.location,
            c.registration_date,
            c.created_at,
            s.plan_name,
            s.billing_cycle,
            s.monthly_charge,
            s.renewal_status,
            COALESCE(cl.churn, 0) AS churn,
            pr.risk_level,
            pr.churn_probability
        FROM customers c
        LEFT JOIN subscriptions s ON c.customer_id = s.customer_id
        LEFT JOIN churn_labels cl ON c.customer_id = cl.customer_id
        LEFT JOIN (
            SELECT p1.customer_id, p1.risk_level, p1.churn_probability
            FROM predictions p1
            INNER JOIN (
                SELECT customer_id, MAX(prediction_date) AS max_date
                FROM predictions
                GROUP BY customer_id
            ) p2 ON p1.customer_id = p2.customer_id AND p1.prediction_date = p2.max_date
        ) pr ON c.customer_id = pr.customer_id
    """

    if search:
        conditions.append("(c.name LIKE %s OR c.customer_code LIKE %s)")
        search_param = f"%{search}%"
        params.extend([search_param, search_param])

    if location:
        conditions.append("c.location = %s")
        params.append(location)

    if plan_name:
        conditions.append("s.plan_name = %s")
        params.append(plan_name)

    if conditions:
        sql += " WHERE " + " AND ".join(conditions)

    sql += " ORDER BY c.customer_id DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])

    with get_db_cursor(dictionary=True) as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
        return rows


def get_customer_by_id(customer_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve single customer by ID."""
    with get_db_cursor(dictionary=True) as cur:
        cur.execute("""
            SELECT customer_id, customer_code, name, age, gender, location, registration_date, created_at
            FROM customers
            WHERE customer_id = %s
        """, (customer_id,))
        return cur.fetchone()


def create_customer(data: CustomerCreate) -> Dict[str, Any]:
    """Create a new customer and associated initial records."""
    reg_date = data.registration_date or date.today()

    with get_db_cursor(dictionary=True, commit=True) as cur:
        # Determine unique customer_code if not supplied
        customer_code = data.customer_code
        if not customer_code:
            cur.execute("SELECT MAX(customer_id) AS max_id FROM customers")
            row = cur.fetchone()
            next_id = (row["max_id"] or 1000) + 1
            customer_code = f"CUST-{next_id}"

        # 1. Insert customer
        cur.execute("""
            INSERT INTO customers (customer_code, name, age, gender, location, registration_date)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (customer_code, data.name, data.age, data.gender, data.location, reg_date))
        customer_id = cur.lastrowid

        # 2. Insert initial subscription
        plan_name = data.plan_name or "Standard"
        billing_cycle = data.billing_cycle or "Monthly"
        monthly_charge = data.monthly_charge or 49.99
        cur.execute("""
            INSERT INTO subscriptions (customer_id, plan_name, billing_cycle, monthly_charge, subscription_start, subscription_months, renewal_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (customer_id, plan_name, billing_cycle, monthly_charge, reg_date, 1, "Active"))

        # 3. Insert initial usage
        cur.execute("""
            INSERT INTO `usage` (customer_id, monthly_logins, usage_hours, monthly_sessions, transactions_count, last_login)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (customer_id, 10, 15.0, 12, 5, reg_date))

        # 4. Insert initial payment
        cur.execute("""
            INSERT INTO payments (customer_id, monthly_payment, total_payment, payment_delays, failed_payments, payment_method, last_payment_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (customer_id, monthly_charge, monthly_charge, 0, 0, data.payment_method or "Credit Card", reg_date))

        # 5. Insert initial complaint record
        cur.execute("""
            INSERT INTO complaints (customer_id, complaint_count, support_tickets, average_resolution_days, satisfaction_score, last_complaint_date)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (customer_id, 0, 0, 0.0, 5.0, None))

        # 6. Insert initial churn label (retained)
        cur.execute("""
            INSERT INTO churn_labels (customer_id, churn, churn_date)
            VALUES (%s, %s, %s)
        """, (customer_id, 0, None))

        # 7. Initial prediction baseline
        cur.execute("""
            INSERT INTO predictions (customer_id, churn_probability, risk_level, model_name)
            VALUES (%s, %s, %s, %s)
        """, (customer_id, 0.1500, "Low", "Baseline-Initial-v1"))

        return {
            "customer_id": customer_id,
            "customer_code": customer_code,
            "name": data.name,
            "message": "Customer created successfully"
        }


def update_customer(customer_id: int, data: CustomerUpdate) -> bool:
    """Update existing customer attributes and subscription details if provided."""
    fields = []
    values = []

    if data.name is not None:
        fields.append("name = %s")
        values.append(data.name)
    if data.age is not None:
        fields.append("age = %s")
        values.append(data.age)
    if data.gender is not None:
        fields.append("gender = %s")
        values.append(data.gender)
    if data.location is not None:
        fields.append("location = %s")
        values.append(data.location)

    sub_fields = []
    sub_values = []
    if data.plan_name is not None:
        sub_fields.append("plan_name = %s")
        sub_values.append(data.plan_name)
    if data.monthly_charge is not None:
        sub_fields.append("monthly_charge = %s")
        sub_values.append(data.monthly_charge)
    if getattr(data, 'billing_cycle', None) is not None:
        sub_fields.append("billing_cycle = %s")
        sub_values.append(data.billing_cycle)

    if not fields and not sub_fields:
        return False

    updated_any = False

    with get_db_cursor(dictionary=True, commit=True) as cur:
        if fields:
            values.append(customer_id)
            sql = f"UPDATE customers SET {', '.join(fields)} WHERE customer_id = %s"
            cur.execute(sql, tuple(values))
            if cur.rowcount > 0:
                updated_any = True

        if sub_fields:
            sub_values.append(customer_id)
            sub_sql = f"UPDATE subscriptions SET {', '.join(sub_fields)} WHERE customer_id = %s"
            cur.execute(sub_sql, tuple(sub_values))
            if cur.rowcount > 0:
                updated_any = True

        return updated_any


def delete_customer(customer_id: int) -> bool:
    """Delete a customer and cascaded related rows."""
    with get_db_cursor(dictionary=True, commit=True) as cur:
        cur.execute("DELETE FROM customers WHERE customer_id = %s", (customer_id,))
        return cur.rowcount > 0


def get_customer_full_profile(customer_id: int) -> Optional[Dict[str, Any]]:
    """Call stored procedure get_customer_full_profile."""
    with get_db_cursor(dictionary=True) as cur:
        cur.callproc("get_customer_full_profile", [customer_id])
        for result in cur.stored_results():
            row = result.fetchone()
            if row:
                return row
    return None


def list_subscriptions(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    with get_db_cursor(dictionary=True) as cur:
        cur.execute("""
            SELECT 
                s.subscription_id,
                s.customer_id,
                c.customer_code,
                c.name AS customer_name,
                s.plan_name,
                s.billing_cycle,
                s.monthly_charge,
                s.subscription_start,
                s.subscription_months,
                s.renewal_status
            FROM subscriptions s
            JOIN customers c ON s.customer_id = c.customer_id
            ORDER BY s.subscription_id DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        return cur.fetchall()


def list_usage(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    with get_db_cursor(dictionary=True) as cur:
        cur.execute("""
            SELECT 
                u.usage_id,
                u.customer_id,
                c.customer_code,
                c.name AS customer_name,
                u.monthly_logins,
                u.usage_hours,
                u.monthly_sessions,
                u.transactions_count,
                u.last_login
            FROM `usage` u
            JOIN customers c ON u.customer_id = c.customer_id
            ORDER BY u.usage_id DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        return cur.fetchall()


def list_payments(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    with get_db_cursor(dictionary=True) as cur:
        cur.execute("""
            SELECT 
                p.payment_id,
                p.customer_id,
                c.customer_code,
                c.name AS customer_name,
                p.monthly_payment,
                p.total_payment,
                p.payment_delays,
                p.failed_payments,
                p.payment_method,
                p.last_payment_date
            FROM payments p
            JOIN customers c ON p.customer_id = c.customer_id
            ORDER BY p.payment_id DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        return cur.fetchall()


def list_complaints(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    with get_db_cursor(dictionary=True) as cur:
        cur.execute("""
            SELECT 
                cmp.complaint_id,
                cmp.customer_id,
                c.customer_code,
                c.name AS customer_name,
                cmp.complaint_count,
                cmp.support_tickets,
                cmp.average_resolution_days,
                cmp.satisfaction_score,
                cmp.last_complaint_date
            FROM complaints cmp
            JOIN customers c ON cmp.customer_id = c.customer_id
            ORDER BY cmp.complaint_id DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        return cur.fetchall()


def list_activity_logs(limit: int = 50) -> List[Dict[str, Any]]:
    with get_db_cursor(dictionary=True) as cur:
        cur.execute("""
            SELECT activity_id, action_type, table_name, record_id, description, created_at
            FROM activity_logs
            ORDER BY activity_id DESC
            LIMIT %s
        """, (limit,))
        return cur.fetchall()
