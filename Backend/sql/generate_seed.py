"""
Database Setup & Realistic Academic Synthetic Data Generator
AI-Based Customer Churn Prediction & Customer Analytics System (Phase 1)
"""

import os
import random
from datetime import date, datetime, timedelta
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = "churn_prediction"

FIRST_NAMES_MALE = [
    "Aarav", "Vihaan", "Aditya", "Sai", "Reyansh", "Arjun", "Rohan", "Kabir",
    "Dhruv", "Siddharth", "Vikram", "Rahul", "Anand", "Nikhil", "Karan",
    "Gaurav", "Suresh", "Manish", "Amit", "Pranav", "Harsh", "Deepak",
    "Ashok", "Kunal", "Rajesh", "Sameer", "Varun", "Abhishek", "Tarun", "Mayank"
]

FIRST_NAMES_FEMALE = [
    "Aanya", "Diya", "Saanvi", "Ananya", "Ishita", "Meera", "Pooja", "Neha",
    "Riya", "Sneha", "Kavya", "Tanvi", "Priya", "Shreya", "Aditi", "Divya",
    "Swati", "Nisha", "Anjali", "Roshni", "Sunita", "Simran", "Preeti",
    "Monika", "Deepa", "Bhavna", "Komal", "Shruti", "Pallavi", "Megha"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Mehta", "Deshmukh", "Kulkarni", "Joshi", "Iyer",
    "Nair", "Reddy", "Gupta", "Singh", "Chopra", "Bhatia", "Malhotra", "Kapoor",
    "Chatterjee", "Banerjee", "Mukherjee", "Thakur", "Yadav", "Pandey", "Mishra",
    "Saxena", "Chauhan", "Bhatt", "Aggarwal", "Rao", "Pillai", "Shah"
]

LOCATIONS = [
    "Mumbai", "Pune", "Bangalore", "Hyderabad", "Delhi NCR", "Chennai",
    "Kolkata", "Ahmedabad", "Jaipur", "Chandigarh", "Indore", "Surat", "Kochi"
]

PLANS = [
    {"name": "Basic", "charge": 19.99},
    {"name": "Standard", "charge": 49.99},
    {"name": "Premium", "charge": 99.99},
    {"name": "Enterprise", "charge": 199.99}
]

BILLING_CYCLES = ["Monthly", "Quarterly", "Annual"]
PAYMENT_METHODS = ["Credit Card", "UPI", "Net Banking", "Debit Card", "PayPal"]


def run_sql_file(cursor, file_path):
    """Execute multi-statement SQL file with DELIMITER support."""
    print(f"Executing SQL file: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    delimiter = ";"
    current_statement = []

    for line in content.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("--") or trimmed.startswith("/*"):
            continue

        if trimmed.upper().startswith("DELIMITER"):
            parts = trimmed.split()
            if len(parts) > 1:
                delimiter = parts[1]
            continue

        current_statement.append(line)

        # Check if line ends with current delimiter
        if trimmed.endswith(delimiter):
            stmt = "\n".join(current_statement)
            # Strip trailing delimiter
            if stmt.endswith(delimiter):
                stmt = stmt[:-len(delimiter)].strip()
            if stmt:
                try:
                    cursor.execute(stmt)
                except mysql.connector.Error as err:
                    print(f"Error executing statement: {err}\nStmt: {stmt[:120]}...")
                    raise err
            current_statement = []


def setup_database_and_schema():
    """Connect to MySQL, create database and run all setup scripts."""
    print("Connecting to MySQL server...")
    conn = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()

    sql_dir = os.path.dirname(__file__)
    schema_file = os.path.join(sql_dir, "schema.sql")
    views_file = os.path.join(sql_dir, "views.sql")
    procedures_file = os.path.join(sql_dir, "procedures.sql")
    triggers_file = os.path.join(sql_dir, "triggers.sql")

    run_sql_file(cursor, schema_file)
    conn.commit()

    run_sql_file(cursor, views_file)
    conn.commit()

    run_sql_file(cursor, procedures_file)
    conn.commit()

    run_sql_file(cursor, triggers_file)
    conn.commit()

    cursor.close()
    conn.close()
    print("Schema, Views, Stored Procedures, and Triggers successfully applied.")


def generate_synthetic_data(num_customers=520):
    """Generate and insert realistic academic synthetic data."""
    print(f"Connecting to {DB_NAME} to generate {num_customers} customer records...")
    conn = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    cursor = conn.cursor(dictionary=True)

    # Check if data already exists
    cursor.execute("SELECT COUNT(*) AS cnt FROM customers")
    existing = cursor.fetchone()["cnt"]
    if existing >= num_customers:
        print(f"Database already has {existing} customers. Skipping generation.")
        cursor.close()
        conn.close()
        return

    random.seed(42)  # For reproducible academic realism
    today = date.today()

    print(f"Seeding {num_customers} customers...")

    for i in range(1, num_customers + 1):
        # 1. Customer Demographics
        customer_code = f"CUST-{1000 + i}"
        gender = random.choice(["Male", "Female", "Non-Binary"])
        if gender == "Male":
            first_name = random.choice(FIRST_NAMES_MALE)
        elif gender == "Female":
            first_name = random.choice(FIRST_NAMES_FEMALE)
        else:
            first_name = random.choice(FIRST_NAMES_MALE + FIRST_NAMES_FEMALE)
        last_name = random.choice(LAST_NAMES)
        name = f"{first_name} {last_name}"
        age = random.randint(19, 68)
        location = random.choice(LOCATIONS)
        days_registered = random.randint(30, 1100)
        registration_date = today - timedelta(days=days_registered)

        # Insert customer (fires trg_customer_after_insert trigger)
        insert_cust = """
            INSERT INTO customers (customer_code, name, age, gender, location, registration_date)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_cust, (customer_code, name, age, gender, location, registration_date))
        customer_id = cursor.lastrowid

        # 2. Subscription
        plan = random.choice(PLANS)
        plan_name = plan["name"]
        billing_cycle = random.choice(BILLING_CYCLES)
        monthly_charge = plan["charge"]
        subscription_months = max(1, days_registered // 30)
        subscription_start = registration_date

        # 3. Usage & Behavior
        # Base usage varies by age and plan
        base_logins = 15 if plan_name == "Basic" else (25 if plan_name == "Standard" else 45)
        monthly_logins = max(1, int(random.gauss(base_logins, 10)))
        usage_hours = round(max(0.5, monthly_logins * random.uniform(0.8, 2.5)), 2)
        monthly_sessions = max(monthly_logins, int(monthly_logins * random.uniform(1.1, 2.2)))
        transactions_count = max(0, int(monthly_logins * random.uniform(0.2, 0.9)))
        last_login_days_ago = random.randint(0, 60)
        last_login = today - timedelta(days=last_login_days_ago)

        # 4. Payment Behavior
        payment_method = random.choice(PAYMENT_METHODS)
        total_payment = round(monthly_charge * subscription_months * random.uniform(0.95, 1.0), 2)
        # Payment delays & failures
        payment_delay_prob = random.random()
        if payment_delay_prob < 0.65:
            payment_delays = 0
            failed_payments = 0
        elif payment_delay_prob < 0.88:
            payment_delays = random.randint(1, 3)
            failed_payments = random.choice([0, 1])
        else:
            payment_delays = random.randint(3, 7)
            failed_payments = random.randint(1, 4)
        last_payment_date = today - timedelta(days=random.randint(1, 35))

        # 5. Complaints & Support
        complaint_prob = random.random()
        if complaint_prob < 0.55:
            complaint_count = 0
            support_tickets = random.choice([0, 1])
            avg_resolution = round(random.uniform(0.5, 2.0), 2)
            satisfaction_score = round(random.uniform(4.0, 5.0), 2)
            last_complaint = None
        elif complaint_prob < 0.82:
            complaint_count = random.randint(1, 2)
            support_tickets = random.randint(1, 3)
            avg_resolution = round(random.uniform(2.0, 5.0), 2)
            satisfaction_score = round(random.uniform(2.8, 4.2), 2)
            last_complaint = today - timedelta(days=random.randint(5, 120))
        else:
            complaint_count = random.randint(3, 6)
            support_tickets = random.randint(3, 8)
            avg_resolution = round(random.uniform(4.5, 12.0), 2)
            satisfaction_score = round(random.uniform(1.0, 2.9), 2)
            last_complaint = today - timedelta(days=random.randint(1, 45))

        # 6. Realistic Churn Modeling (Academic Latent Risk Function)
        risk_score = 0.08
        risk_score += complaint_count * 0.11
        risk_score += support_tickets * 0.04
        risk_score += payment_delays * 0.07
        risk_score += failed_payments * 0.12
        risk_score += (5.0 - satisfaction_score) * 0.09
        if last_login_days_ago > 30:
            risk_score += 0.20
        if subscription_months < 6:
            risk_score += 0.08
        elif subscription_months > 24:
            risk_score -= 0.15
        if monthly_logins < 8:
            risk_score += 0.12

        # Add stochastic realistic noise
        noise = random.uniform(-0.12, 0.12)
        churn_prob = max(0.02, min(0.98, risk_score + noise))
        churn_prob = round(churn_prob, 4)

        # Churn Decision (Stochastic threshold with ~24-28% overall positive class)
        is_churn = 1 if (churn_prob >= 0.52 or (churn_prob >= 0.40 and random.random() < 0.45)) else 0

        churn_date = today - timedelta(days=random.randint(5, 75)) if is_churn else None
        renewal_status = "Cancelled" if is_churn else random.choice(["Active", "Active", "Auto-Renew", "Auto-Renew", "Manual"])

        # Insert subscription
        cursor.execute("""
            INSERT INTO subscriptions (customer_id, plan_name, billing_cycle, monthly_charge, subscription_start, subscription_months, renewal_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (customer_id, plan_name, billing_cycle, monthly_charge, subscription_start, subscription_months, renewal_status))

        # Insert usage
        cursor.execute("""
            INSERT INTO `usage` (customer_id, monthly_logins, usage_hours, monthly_sessions, transactions_count, last_login)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (customer_id, monthly_logins, usage_hours, monthly_sessions, transactions_count, last_login))

        # Insert payments
        cursor.execute("""
            INSERT INTO payments (customer_id, monthly_payment, total_payment, payment_delays, failed_payments, payment_method, last_payment_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (customer_id, monthly_charge, total_payment, payment_delays, failed_payments, payment_method, last_payment_date))

        # Insert complaints
        cursor.execute("""
            INSERT INTO complaints (customer_id, complaint_count, support_tickets, average_resolution_days, satisfaction_score, last_complaint_date)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (customer_id, complaint_count, support_tickets, avg_resolution, satisfaction_score, last_complaint))

        # Insert churn label
        cursor.execute("""
            INSERT INTO churn_labels (customer_id, churn, churn_date)
            VALUES (%s, %s, %s)
        """, (customer_id, is_churn, churn_date))

        # 7. Initial Model Prediction
        # Compute risk level based on churn_probability
        if churn_prob >= 0.65:
            risk_level = "High"
        elif churn_prob >= 0.35:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        model_name = "GradientBoosting-Baseline-v1"
        prediction_date = datetime.now() - timedelta(hours=random.randint(1, 48))

        # Insert prediction (fires trg_prediction_after_insert trigger)
        cursor.execute("""
            INSERT INTO predictions (customer_id, churn_probability, risk_level, model_name, prediction_date)
            VALUES (%s, %s, %s, %s, %s)
        """, (customer_id, churn_prob, risk_level, model_name, prediction_date))

        if i % 100 == 0 or i == num_customers:
            conn.commit()
            print(f"Generated and committed {i}/{num_customers} customer records...")

    cursor.close()
    conn.close()
    print("Synthetic data generation completed successfully!")


if __name__ == "__main__":
    setup_database_and_schema()
    generate_synthetic_data(num_customers=520)
