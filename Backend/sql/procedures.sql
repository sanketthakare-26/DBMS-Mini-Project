USE churn_prediction;

DROP PROCEDURE IF EXISTS get_customer_full_profile;
DROP PROCEDURE IF EXISTS get_high_risk_customers;

DELIMITER //

-- ========================================================
-- PROCEDURE 1: get_customer_full_profile
-- Returns complete unified customer details including subscription,
-- usage, payments, complaints, churn status, and latest prediction.
-- ========================================================
CREATE PROCEDURE get_customer_full_profile(IN p_customer_id INT)
BEGIN
    SELECT 
        c.customer_id,
        c.customer_code,
        c.name,
        c.age,
        c.gender,
        c.location,
        c.registration_date,
        c.created_at,
        -- Subscriptions
        s.subscription_id,
        s.plan_name,
        s.billing_cycle,
        s.monthly_charge,
        s.subscription_start,
        s.subscription_months,
        s.renewal_status,
        -- Usage
        u.usage_id,
        u.monthly_logins,
        u.usage_hours,
        u.monthly_sessions,
        u.transactions_count,
        u.last_login,
        -- Payments
        p.payment_id,
        p.monthly_payment,
        p.total_payment,
        p.payment_delays,
        p.failed_payments,
        p.payment_method,
        p.last_payment_date,
        -- Complaints
        cmp.complaint_id,
        cmp.complaint_count,
        cmp.support_tickets,
        cmp.average_resolution_days,
        cmp.satisfaction_score,
        cmp.last_complaint_date,
        -- Churn Label
        COALESCE(cl.churn, 0) AS churn,
        cl.churn_date,
        -- Latest Prediction
        pr.prediction_id,
        pr.churn_probability,
        pr.risk_level,
        pr.model_name,
        pr.prediction_date
    FROM customers c
    LEFT JOIN subscriptions s ON c.customer_id = s.customer_id
    LEFT JOIN `usage` u ON c.customer_id = u.customer_id
    LEFT JOIN payments p ON c.customer_id = p.customer_id
    LEFT JOIN complaints cmp ON c.customer_id = cmp.customer_id
    LEFT JOIN churn_labels cl ON c.customer_id = cl.customer_id
    LEFT JOIN (
        SELECT p1.*
        FROM predictions p1
        INNER JOIN (
            SELECT customer_id, MAX(prediction_date) AS max_date
            FROM predictions
            GROUP BY customer_id
        ) p2 ON p1.customer_id = p2.customer_id AND p1.prediction_date = p2.max_date
    ) pr ON c.customer_id = pr.customer_id
    WHERE c.customer_id = p_customer_id;
END //

-- ========================================================
-- PROCEDURE 2: get_high_risk_customers
-- Returns customers whose latest prediction risk is 'High'
-- ========================================================
CREATE PROCEDURE get_high_risk_customers()
BEGIN
    SELECT 
        c.customer_id,
        c.customer_code,
        c.name,
        c.location,
        s.plan_name,
        s.monthly_charge,
        p.payment_delays,
        cmp.complaint_count,
        cmp.satisfaction_score,
        pr.churn_probability,
        pr.risk_level,
        pr.model_name,
        pr.prediction_date
    FROM customers c
    JOIN (
        SELECT p1.*
        FROM predictions p1
        INNER JOIN (
            SELECT customer_id, MAX(prediction_date) AS max_date
            FROM predictions
            GROUP BY customer_id
        ) p2 ON p1.customer_id = p2.customer_id AND p1.prediction_date = p2.max_date
    ) pr ON c.customer_id = pr.customer_id
    LEFT JOIN subscriptions s ON c.customer_id = s.customer_id
    LEFT JOIN payments p ON c.customer_id = p.customer_id
    LEFT JOIN complaints cmp ON c.customer_id = cmp.customer_id
    WHERE pr.risk_level = 'High'
    ORDER BY pr.churn_probability DESC, c.customer_id ASC;
END //

DELIMITER ;
