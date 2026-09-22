from typing import List, Dict, Any, Optional
from database import get_db_cursor


def get_overview_analytics() -> Dict[str, Any]:
    """Calculate key business & churn KPI metrics directly from database."""
    with get_db_cursor(dictionary=True) as cur:
        # Total customers and churn counts
        cur.execute("""
            SELECT 
                COUNT(*) AS total_customers,
                SUM(CASE WHEN cl.churn = 1 THEN 1 ELSE 0 END) AS churned_customers,
                SUM(CASE WHEN cl.churn = 0 OR cl.churn IS NULL THEN 1 ELSE 0 END) AS retained_customers,
                ROUND((SUM(CASE WHEN cl.churn = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS churn_rate_pct
            FROM customers c
            LEFT JOIN churn_labels cl ON c.customer_id = cl.customer_id
        """)
        churn_stats = cur.fetchone() or {}

        # Subscription & revenue metrics
        cur.execute("""
            SELECT 
                SUM(CASE WHEN renewal_status IN ('Active', 'Auto-Renew') THEN 1 ELSE 0 END) AS active_subscriptions,
                ROUND(AVG(monthly_charge), 2) AS avg_monthly_charge
            FROM subscriptions
        """)
        sub_stats = cur.fetchone() or {}

        # Total revenue collected
        cur.execute("SELECT ROUND(SUM(total_payment), 2) AS total_revenue FROM payments")
        rev_stats = cur.fetchone() or {}

        # Average satisfaction score & usage
        cur.execute("""
            SELECT 
                ROUND(AVG(satisfaction_score), 2) AS avg_satisfaction_score,
                ROUND(AVG(complaint_count), 2) AS avg_complaints
            FROM complaints
        """)
        comp_stats = cur.fetchone() or {}

        cur.execute("""
            SELECT 
                ROUND(AVG(usage_hours), 2) AS avg_usage_hours,
                ROUND(AVG(monthly_logins), 2) AS avg_monthly_logins
            FROM `usage`
        """)
        usage_stats = cur.fetchone() or {}

        # High risk predictions count
        cur.execute("""
            SELECT COUNT(*) AS high_risk_count
            FROM predictions
            WHERE risk_level = 'High'
        """)
        risk_stats = cur.fetchone() or {}

        return {
            "total_customers": churn_stats.get("total_customers", 0),
            "churned_customers": churn_stats.get("churned_customers", 0),
            "retained_customers": churn_stats.get("retained_customers", 0),
            "churn_rate_pct": float(churn_stats.get("churn_rate_pct", 0.0) or 0.0),
            "active_subscriptions": sub_stats.get("active_subscriptions", 0),
            "total_revenue": float(rev_stats.get("total_revenue", 0.0) or 0.0),
            "avg_monthly_charge": float(sub_stats.get("avg_monthly_charge", 0.0) or 0.0),
            "avg_satisfaction_score": float(comp_stats.get("avg_satisfaction_score", 0.0) or 0.0),
            "avg_complaints": float(comp_stats.get("avg_complaints", 0.0) or 0.0),
            "avg_usage_hours": float(usage_stats.get("avg_usage_hours", 0.0) or 0.0),
            "avg_monthly_logins": float(usage_stats.get("avg_monthly_logins", 0.0) or 0.0),
            "high_risk_customers_count": risk_stats.get("high_risk_count", 0),
        }


def get_churn_analytics() -> Dict[str, Any]:
    """Retrieve detailed churn breakdowns from customer_churn_view."""
    with get_db_cursor(dictionary=True) as cur:
        # Churn by plan
        cur.execute("""
            SELECT 
                plan_name,
                COUNT(*) AS total,
                SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END) AS churned,
                ROUND((SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS churn_rate
            FROM customer_churn_view
            GROUP BY plan_name
        """)
        by_plan = cur.fetchall()

        # Churn by location
        cur.execute("""
            SELECT 
                location,
                COUNT(*) AS total,
                SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END) AS churned,
                ROUND((SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS churn_rate
            FROM customer_churn_view
            GROUP BY location
            ORDER BY total DESC
            LIMIT 10
        """)
        by_location = cur.fetchall()

        # Churn by age group
        cur.execute("""
            SELECT 
                CASE 
                    WHEN age < 30 THEN '18-29'
                    WHEN age < 45 THEN '30-44'
                    WHEN age < 60 THEN '45-59'
                    ELSE '60+'
                END AS age_group,
                COUNT(*) AS total,
                SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END) AS churned,
                ROUND((SUM(CASE WHEN churn = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS churn_rate
            FROM customer_churn_view
            GROUP BY 
                CASE 
                    WHEN age < 30 THEN '18-29'
                    WHEN age < 45 THEN '30-44'
                    WHEN age < 60 THEN '45-59'
                    ELSE '60+'
                END
        """)
        by_age = cur.fetchall()

        # Risk distribution from latest predictions
        cur.execute("""
            SELECT 
                risk_level,
                COUNT(*) AS count,
                ROUND(AVG(churn_probability) * 100, 2) AS avg_probability_pct
            FROM predictions
            GROUP BY risk_level
            ORDER BY FIELD(risk_level, 'High', 'Medium', 'Low')
        """)
        risk_distribution = cur.fetchall()

        return {
            "by_plan": by_plan,
            "by_location": by_location,
            "by_age_group": by_age,
            "risk_distribution": risk_distribution
        }


def get_subscription_churn_summary() -> List[Dict[str, Any]]:
    """Query subscription_churn_summary SQL View."""
    with get_db_cursor(dictionary=True) as cur:
        cur.execute("""
            SELECT 
                plan_name,
                billing_cycle,
                total_customers,
                churned_customers,
                retained_customers,
                churn_rate_pct,
                avg_monthly_charge,
                total_revenue
            FROM subscription_churn_summary
            ORDER BY plan_name, billing_cycle
        """)
        return cur.fetchall()


def get_payment_behavior_summary() -> List[Dict[str, Any]]:
    """Query payment_behavior_summary SQL View."""
    with get_db_cursor(dictionary=True) as cur:
        cur.execute("""
            SELECT 
                payment_method,
                total_customers,
                churned_customers,
                churn_rate_pct,
                avg_payment_delays,
                avg_failed_payments,
                avg_monthly_payment
            FROM payment_behavior_summary
            ORDER BY total_customers DESC
        """)
        return cur.fetchall()


def get_complaint_churn_summary() -> List[Dict[str, Any]]:
    """Query complaint_churn_summary SQL View."""
    with get_db_cursor(dictionary=True) as cur:
        cur.execute("""
            SELECT 
                satisfaction_tier,
                total_customers,
                churned_customers,
                churn_rate_pct,
                avg_complaints,
                avg_support_tickets,
                avg_resolution_days,
                avg_satisfaction_score
            FROM complaint_churn_summary
        """)
        return cur.fetchall()


def list_predictions(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """List recent predictions with joined customer info."""
    with get_db_cursor(dictionary=True) as cur:
        cur.execute("""
            SELECT 
                p.prediction_id,
                p.customer_id,
                c.customer_code,
                c.name AS customer_name,
                p.churn_probability,
                p.risk_level,
                p.model_name,
                p.prediction_date
            FROM predictions p
            JOIN customers c ON p.customer_id = c.customer_id
            ORDER BY p.prediction_id DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        return cur.fetchall()


def get_high_risk_customers() -> List[Dict[str, Any]]:
    """Call stored procedure get_high_risk_customers."""
    with get_db_cursor(dictionary=True) as cur:
        cur.callproc("get_high_risk_customers")
        for result in cur.stored_results():
            rows = result.fetchall()
            return rows
    return []
