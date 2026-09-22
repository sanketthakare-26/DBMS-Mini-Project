USE churn_prediction;

-- ========================================================
-- VIEW 1: customer_churn_view
-- ML-ready unified view combining customer profiles, subscriptions,
-- usage metrics, payments, complaints, and churn labels.
-- ========================================================
CREATE OR REPLACE VIEW customer_churn_view AS
SELECT 
    c.customer_id,
    c.customer_code,
    c.name,
    c.age,
    c.gender,
    c.location,
    c.registration_date,
    s.plan_name,
    s.billing_cycle,
    s.monthly_charge,
    s.subscription_months,
    s.renewal_status,
    u.monthly_logins,
    u.usage_hours,
    u.monthly_sessions,
    u.transactions_count,
    u.last_login,
    p.monthly_payment,
    p.total_payment,
    p.payment_delays,
    p.failed_payments,
    p.payment_method,
    p.last_payment_date,
    cmp.complaint_count,
    cmp.support_tickets,
    cmp.average_resolution_days,
    cmp.satisfaction_score,
    COALESCE(cl.churn, 0) AS churn,
    cl.churn_date
FROM customers c
LEFT JOIN subscriptions s ON c.customer_id = s.customer_id
LEFT JOIN `usage` u ON c.customer_id = u.customer_id
LEFT JOIN payments p ON c.customer_id = p.customer_id
LEFT JOIN complaints cmp ON c.customer_id = cmp.customer_id
LEFT JOIN churn_labels cl ON c.customer_id = cl.customer_id;

-- ========================================================
-- VIEW 2: subscription_churn_summary
-- Aggregates customer count, churned count, churn rate %,
-- average monthly charge, and total revenue by plan and billing cycle.
-- ========================================================
CREATE OR REPLACE VIEW subscription_churn_summary AS
SELECT 
    COALESCE(s.plan_name, 'Unknown') AS plan_name,
    COALESCE(s.billing_cycle, 'Unknown') AS billing_cycle,
    COUNT(c.customer_id) AS total_customers,
    SUM(CASE WHEN cl.churn = 1 THEN 1 ELSE 0 END) AS churned_customers,
    SUM(CASE WHEN cl.churn = 0 OR cl.churn IS NULL THEN 1 ELSE 0 END) AS retained_customers,
    ROUND(
        (SUM(CASE WHEN cl.churn = 1 THEN 1 ELSE 0 END) / COUNT(c.customer_id)) * 100, 
        2
    ) AS churn_rate_pct,
    ROUND(AVG(s.monthly_charge), 2) AS avg_monthly_charge,
    ROUND(SUM(p.total_payment), 2) AS total_revenue
FROM customers c
JOIN subscriptions s ON c.customer_id = s.customer_id
LEFT JOIN payments p ON c.customer_id = p.customer_id
LEFT JOIN churn_labels cl ON c.customer_id = cl.customer_id
GROUP BY s.plan_name, s.billing_cycle;

-- ========================================================
-- VIEW 3: payment_behavior_summary
-- Evaluates the correlation between payment methods, payment delays,
-- failed payments, and customer churn.
-- ========================================================
CREATE OR REPLACE VIEW payment_behavior_summary AS
SELECT 
    p.payment_method,
    COUNT(c.customer_id) AS total_customers,
    SUM(CASE WHEN cl.churn = 1 THEN 1 ELSE 0 END) AS churned_customers,
    ROUND(
        (SUM(CASE WHEN cl.churn = 1 THEN 1 ELSE 0 END) / COUNT(c.customer_id)) * 100, 
        2
    ) AS churn_rate_pct,
    ROUND(AVG(p.payment_delays), 2) AS avg_payment_delays,
    ROUND(AVG(p.failed_payments), 2) AS avg_failed_payments,
    ROUND(AVG(p.monthly_payment), 2) AS avg_monthly_payment
FROM customers c
JOIN payments p ON c.customer_id = p.customer_id
LEFT JOIN churn_labels cl ON c.customer_id = cl.customer_id
GROUP BY p.payment_method;

-- ========================================================
-- VIEW 4: complaint_churn_summary
-- Analyzes support interaction metrics and customer satisfaction
-- score tiers in relation to churn likelihood.
-- ========================================================
CREATE OR REPLACE VIEW complaint_churn_summary AS
SELECT 
    CASE 
        WHEN cmp.satisfaction_score >= 4.0 THEN 'High Satisfaction (4.0-5.0)'
        WHEN cmp.satisfaction_score >= 2.5 THEN 'Medium Satisfaction (2.5-3.9)'
        ELSE 'Low Satisfaction (<2.5)'
    END AS satisfaction_tier,
    COUNT(c.customer_id) AS total_customers,
    SUM(CASE WHEN cl.churn = 1 THEN 1 ELSE 0 END) AS churned_customers,
    ROUND(
        (SUM(CASE WHEN cl.churn = 1 THEN 1 ELSE 0 END) / COUNT(c.customer_id)) * 100, 
        2
    ) AS churn_rate_pct,
    ROUND(AVG(cmp.complaint_count), 2) AS avg_complaints,
    ROUND(AVG(cmp.support_tickets), 2) AS avg_support_tickets,
    ROUND(AVG(cmp.average_resolution_days), 2) AS avg_resolution_days,
    ROUND(AVG(cmp.satisfaction_score), 2) AS avg_satisfaction_score
FROM customers c
JOIN complaints cmp ON c.customer_id = cmp.customer_id
LEFT JOIN churn_labels cl ON c.customer_id = cl.customer_id
GROUP BY 
    CASE 
        WHEN cmp.satisfaction_score >= 4.0 THEN 'High Satisfaction (4.0-5.0)'
        WHEN cmp.satisfaction_score >= 2.5 THEN 'Medium Satisfaction (2.5-3.9)'
        ELSE 'Low Satisfaction (<2.5)'
    END;
