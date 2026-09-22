-- ========================================================
-- DATABASE CREATION: churn_prediction
-- ========================================================
CREATE DATABASE IF NOT EXISTS churn_prediction
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE churn_prediction;

-- ========================================================
-- 1. TABLE: customers
-- ========================================================
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    location VARCHAR(100) NOT NULL,
    registration_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer_code (customer_code),
    INDEX idx_customer_location (location),
    INDEX idx_customer_created (created_at)
) ENGINE=InnoDB;

-- ========================================================
-- 2. TABLE: subscriptions
-- ========================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    billing_cycle VARCHAR(30) NOT NULL,
    monthly_charge DECIMAL(10,2) NOT NULL,
    subscription_start DATE NOT NULL,
    subscription_months INT NOT NULL DEFAULT 1,
    renewal_status VARCHAR(30) NOT NULL DEFAULT 'Active',
    INDEX idx_sub_customer (customer_id),
    INDEX idx_sub_plan (plan_name),
    INDEX idx_sub_renewal (renewal_status),
    CONSTRAINT fk_subscriptions_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 3. TABLE: usage
-- ========================================================
CREATE TABLE IF NOT EXISTS `usage` (
    usage_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    monthly_logins INT NOT NULL DEFAULT 0,
    usage_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monthly_sessions INT NOT NULL DEFAULT 0,
    transactions_count INT NOT NULL DEFAULT 0,
    last_login DATE,
    INDEX idx_usage_customer (customer_id),
    CONSTRAINT fk_usage_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 4. TABLE: payments
-- ========================================================
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    monthly_payment DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_payment DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_delays INT NOT NULL DEFAULT 0,
    failed_payments INT NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL,
    last_payment_date DATE,
    INDEX idx_payments_customer (customer_id),
    INDEX idx_payments_method (payment_method),
    CONSTRAINT fk_payments_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 5. TABLE: complaints
-- ========================================================
CREATE TABLE IF NOT EXISTS complaints (
    complaint_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    complaint_count INT NOT NULL DEFAULT 0,
    support_tickets INT NOT NULL DEFAULT 0,
    average_resolution_days DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    satisfaction_score DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    last_complaint_date DATE,
    INDEX idx_complaints_customer (customer_id),
    INDEX idx_complaints_score (satisfaction_score),
    CONSTRAINT fk_complaints_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 6. TABLE: churn_labels
-- ========================================================
CREATE TABLE IF NOT EXISTS churn_labels (
    label_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    churn INT NOT NULL DEFAULT 0, -- 0 = retained, 1 = churned
    churn_date DATE DEFAULT NULL,
    label_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_churn_customer (customer_id),
    INDEX idx_churn_status (churn),
    CONSTRAINT fk_churn_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 7. TABLE: predictions
-- ========================================================
CREATE TABLE IF NOT EXISTS predictions (
    prediction_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    churn_probability DECIMAL(6,4) NOT NULL,
    risk_level VARCHAR(20) NOT NULL, -- Low, Medium, High
    model_name VARCHAR(100) NOT NULL,
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pred_customer (customer_id),
    INDEX idx_pred_risk (risk_level),
    INDEX idx_pred_date (prediction_date),
    CONSTRAINT fk_predictions_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 8. TABLE: activity_logs
-- ========================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    activity_id INT PRIMARY KEY AUTO_INCREMENT,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_action (action_type),
    INDEX idx_activity_created (created_at)
) ENGINE=InnoDB;
