# 🚀 AI-Based Customer Churn Prediction & Customer Analytics System

> An enterprise-grade, full-stack predictive intelligence platform featuring a **FastAPI** backend, **MySQL 8.0** normalized relational database, and an interactive **React + Vite** analytics dashboard with **real-time database audit tracking** and **Scikit-learn Machine Learning prediction inference**.

---

## 📑 Table of Contents
- [✨ Key System Highlights](#-key-system-highlights)
- [🏗️ System Architecture](#️-system-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🗄️ Database Architecture & Schema](#️-database-architecture--schema)
- [🤖 Machine Learning Prediction Engine](#-machine-learning-prediction-engine)
- [📡 API Endpoints Documentation](#-api-endpoints-documentation)
- [🚀 Getting Started & Local Setup](#-getting-started--local-setup)
- [📊 Dashboard & Page Overview](#-dashboard--page-overview)

---

## ✨ Key System Highlights

### ⚡ 1. Zero Mock Data — 100% Real Database & ML Pipeline
- **Strict Academic Integrity**: Zero mock or synthetic fallback inside the frontend. Every metric, chart, and table queries the live **FastAPI** backend, which reads from **MySQL 8.0**.
- **Real-Time Synchronisation**: Configurable auto-polling (Off / 15s / 30s / 60s) with live indicator tracking MySQL connectivity.

### 🧠 2. Trained Machine Learning Inference
- **Predict Churn Probability**: Ingests 16 customer behavioral and financial features to compute precise churn probabilities ($0.00$ to $1.00$).
- **Centralized Risk Tiers**:
  - 🟢 **LOW**: $0\% - 30\%$
  - 🟡 **MEDIUM**: $31\% - 60\%$
  - 🔴 **HIGH**: $61\% - 100\%$
- **Batch Processing**: Run vectorized predictions across all 520 database records with one click (`POST /api/predictions/run-all`).
- **Feature Explainability**: Ranked feature importances exposed directly to the user (e.g. `satisfaction_score`, `payment_delays`, `complaint_count`).

### 🗄️ 3. Advanced DBMS Implementations
- **Normalized 3NF Schema**: 8 interconnected relational tables with primary keys, foreign keys (`ON DELETE CASCADE`), and multi-column indexes.
- **Analytical Views**: `customer_churn_view`, `subscription_churn_summary`, `payment_behavior_summary`, `complaint_churn_summary`.
- **Stored Procedures**: `get_customer_full_profile(customer_id)` and `get_high_risk_customers()`.
- **Database Triggers**: Automated audit trail on `customers` (`INSERT`, `UPDATE`, `DELETE`) and `predictions` (`INSERT`), logging directly into `activity_logs`.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 React + Vite Frontend (SPA)                 │
│   • 13 Dedicated Routes with React Router v7                │
│   • Interactive Recharts Data Visualizations                │
│   • Single & Batch ML Prediction Runners                    │
│   • 360° Customer Behavioral Profiles                       │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTP / REST JSON
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend (Python)                 │
│   • Modular Routers (customers, analytics, predict, model)  │
│   • Prediction Service with Cached ML Pipeline              │
│   • MySQL Connection Pooling & Context Managers             │
└──────────────────────────────▲──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
┌───────────▼────────────┐             ┌──────────▼────────────┐
│    MySQL 8.0 Storage   │             │   Scikit-learn Engine │
│ • 8 Relational Tables  │             │ • ColumnTransformer   │
│ • 4 Analytical Views   │             │ • Scalers & Encoders  │
│ • 2 Stored Procedures  │             │ • 4 Model Benchmarks  │
│ • 4 Audit Triggers     │             │ • Joblib Pipeline     │
└────────────────────────┘             └───────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite 8)
- **Routing**: React Router v7
- **Visualizations**: Recharts 3
- **Iconography**: Lucide React
- **Styling**: Vanilla CSS (Tailored glassmorphism, responsive grid layouts)

### Backend
- **Framework**: FastAPI (Python 3.12 / 3.9+)
- **Server**: Uvicorn ASGI
- **Validation**: Pydantic v2
- **Driver**: `mysql-connector-python` with connection pooling

### Machine Learning
- **Framework**: Scikit-learn
- **Data Manipulation**: Pandas & NumPy
- **Serialization**: Joblib
- **Cross-Validation**: 5-Fold StratifiedKFold

---

## 📁 Project Structure

```text
DBMS-Mini-Project/
├── Backend/
│   ├── main.py                  # FastAPI entry point & CORS configuration
│   ├── database.py              # MySQL connection pool & context manager
│   ├── .env                     # Database credentials (DB_NAME=churn_prediction)
│   ├── requirements.txt         # Backend Python dependencies
│   ├── models/                  # Pydantic data models & request/response schemas
│   ├── routes/                  # Modular route handlers (customers, predict, model, etc.)
│   ├── services/                # Business logic & churn prediction engine
│   ├── ml/                      # ML training, cross-validation, preprocessing & models
│   │   ├── preprocessing.py     # ColumnTransformer (imputers, scalers, OneHotEncoder)
│   │   ├── train_model.py       # 4-model trainer, benchmark comparison, joblib export
│   │   ├── evaluate_model.py    # StratifiedKFold CV & metric evaluators
│   │   └── models/
│   │       ├── churn_model.pkl  # Winning serialized ML pipeline
│   │       └── model_metrics.json # Evaluation benchmarks & feature importances
│   └── sql/                     # DDL scripts, views, procedures, triggers, seed script
├── src/
│   ├── components/              # Navbar, Sidebar, Toast notifications, StatCards
│   ├── pages/                   # 13 Dedicated Dashboard Pages
│   │   ├── DashboardPage.jsx
│   │   ├── CustomersPage.jsx
│   │   ├── CustomerProfilePage.jsx
│   │   ├── ChurnPredictionPage.jsx
│   │   ├── HighRiskPage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── SubscriptionsPage.jsx
│   │   ├── PaymentsPage.jsx
│   │   ├── ComplaintsPage.jsx
│   │   ├── ModelPerformancePage.jsx
│   │   ├── PredictionHistoryPage.jsx
│   │   ├── DatabaseActivityPage.jsx
│   │   └── AboutPage.jsx
│   ├── services/
│   │   └── api.js               # Client API connector to FastAPI
│   ├── App.jsx                  # React router setup & sync coordinator
│   └── App.css                  # Comprehensive design system
├── package.json
└── vite.config.js
```

---

## 🤖 Machine Learning Model Benchmarks

Trained directly on `customer_churn_view` across 520 realistic customer profiles:

| Candidate Model | Test Accuracy | Precision | Recall | F1 Score | Test ROC-AUC | 5-Fold CV ROC-AUC |
|---|---|---|---|---|---|---|
| **Logistic Regression** *(Selected)* | **90.38%** | **89.29%** | **92.59%** | **0.9091** | **0.9759** | **0.9370** |
| Random Forest | 91.35% | 89.47% | 94.44% | 0.9189 | 0.9693 | 0.9205 |
| Gradient Boosting | 89.42% | 87.72% | 92.59% | 0.9009 | 0.9626 | 0.9130 |
| Decision Tree | 83.65% | 81.36% | 88.89% | 0.8496 | 0.8439 | 0.8001 |

---

## 🚀 Getting Started & Local Setup

### 1. Backend Setup (FastAPI & MySQL)

```bash
# 1. Navigate to Backend
cd Backend

# 2. Configure .env with your MySQL credentials
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=churn_prediction

# 3. Initialize database schema & seed 520 records
python sql/generate_seed.py

# 4. Train the Machine Learning models
python ml/train_model.py

# 5. Start the FastAPI server
uvicorn main:app --reload --port 8000
```

FastAPI server runs at: `http://127.0.0.1:8000`  
Swagger API documentation: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup (React + Vite)

```bash
# In the root directory:
npm install
npm run dev
```

Dashboard is accessible at: `http://localhost:5173`

---

## 📊 Dashboard & Page Navigation

1. **Dashboard** (`/`): Executive KPI cards, Active vs Churned donut, Risk distribution, Churn by plan, and High-Risk alerts.
2. **Customers** (`/customers`): Multi-filter table with search, sorting, pagination, Add Customer modal, and direct profile navigation.
3. **Customer Profile** (`/customers/:id`): 360° behavioral diagnostic view with visual risk gauge and in-place live ML re-prediction button.
4. **Churn Prediction** (`/prediction`): Interactive customer picker, feature customizer, real-time ML inference, and batch runner across all 520 customers.
5. **High Risk Customers** (`/high-risk`): Interventions table sorted by highest churn probability descending.
6. **Analytics** (`/analytics`): Deep-dive demographic, plan, delinquency, and support satisfaction views.
7. **Subscriptions** (`/subscriptions`): SQL view `subscription_churn_summary` metrics and active subscriber table.
8. **Payments** (`/payments`): Payment behavior view and delinquency vs churn tracking.
9. **Complaints** (`/complaints`): Support ticket resolution times and satisfaction tier distributions.
10. **Model Performance** (`/model-performance`): Metrics comparison, cross-validation scores, and feature importance chart.
11. **Prediction History** (`/prediction-history`): Complete audit history of ML inferences saved in MySQL.
12. **Database Activity** (`/database-activity`): Live trigger-generated audit trail for INSERT, UPDATE, and DELETE events.
13. **About Project** (`/about`): Academic project specifications, system architecture flow, and future scope.