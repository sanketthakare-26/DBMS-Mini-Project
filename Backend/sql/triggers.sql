USE churn_prediction;

DROP TRIGGER IF EXISTS trg_customer_after_insert;
DROP TRIGGER IF EXISTS trg_customer_after_update;
DROP TRIGGER IF EXISTS trg_customer_after_delete;
DROP TRIGGER IF EXISTS trg_prediction_after_insert;

DELIMITER //

-- ========================================================
-- TRIGGER 1: trg_customer_after_insert
-- Logs new customer creation in activity_logs
-- ========================================================
CREATE TRIGGER trg_customer_after_insert
AFTER INSERT ON customers
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (action_type, table_name, record_id, description, created_at)
    VALUES (
        'INSERT',
        'customers',
        NEW.customer_id,
        CONCAT('New customer registered: ', NEW.name, ' (Code: ', NEW.customer_code, ', Location: ', NEW.location, ')'),
        NOW()
    );
END //

-- ========================================================
-- TRIGGER 2: trg_customer_after_update
-- Logs customer details updates in activity_logs
-- ========================================================
CREATE TRIGGER trg_customer_after_update
AFTER UPDATE ON customers
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (action_type, table_name, record_id, description, created_at)
    VALUES (
        'UPDATE',
        'customers',
        NEW.customer_id,
        CONCAT('Customer updated: ', NEW.name, ' (Code: ', NEW.customer_code, ', Age: ', NEW.age, ', Location: ', NEW.location, ')'),
        NOW()
    );
END //

-- ========================================================
-- TRIGGER 3: trg_customer_after_delete
-- Logs customer deletions in activity_logs
-- ========================================================
CREATE TRIGGER trg_customer_after_delete
AFTER DELETE ON customers
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (action_type, table_name, record_id, description, created_at)
    VALUES (
        'DELETE',
        'customers',
        OLD.customer_id,
        CONCAT('Customer record deleted: ', OLD.name, ' (Code: ', OLD.customer_code, ')'),
        NOW()
    );
END //

-- ========================================================
-- TRIGGER 4: trg_prediction_after_insert
-- Logs new churn predictions in activity_logs
-- ========================================================
CREATE TRIGGER trg_prediction_after_insert
AFTER INSERT ON predictions
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (action_type, table_name, record_id, description, created_at)
    VALUES (
        'INSERT',
        'predictions',
        NEW.prediction_id,
        CONCAT('Churn prediction recorded for Customer ID ', NEW.customer_id, ': ', NEW.risk_level, ' Risk (Probability: ', ROUND(NEW.churn_probability * 100, 1), '% via ', NEW.model_name, ')'),
        NOW()
    );
END //

DELIMITER ;
