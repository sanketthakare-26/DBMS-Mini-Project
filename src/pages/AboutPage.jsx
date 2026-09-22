import {
  Database,
  BrainCircuit,
  LayoutDashboard,
  Server,
  Code2,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../components/shared';

export default function AboutPage() {
  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">About System</h1>
          <p className="page-lead">
            Architecture and technical implementation details
          </p>
        </div>
      </div>

      {/* Hero Overview */}
      <div className="about-hero-card">
        <div className="about-hero-badge">Full-Stack Intelligence</div>
        <h2>Customer Retention & Predictive Analytics Engine</h2>
        <p>
          A full-stack data management and predictive intelligence system connecting <strong>MySQL 8.0</strong> relational storage, 
          a <strong>FastAPI</strong> backend, and a <strong>Scikit-learn</strong> machine learning pipeline with a modern, responsive <strong>React</strong> dashboard.
        </p>
      </div>

      {/* System Architecture Visual Flow */}
      <Card title="System Architecture & Data Pipeline" subtitle="End-to-end data flow from storage to dashboard">

        <div className="architecture-flow-container">
          <div className="arch-step">
            <div className="arch-step-icon">
              <Database size={24} />
            </div>
            <h4>1. MySQL Storage</h4>
            <p>Normalized Relational Database (<code>churn_prediction</code>) with 8 tables, FK cascades & indexes</p>
          </div>

          <div className="arch-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="arch-step">
            <div className="arch-step-icon">
              <Layers size={24} />
            </div>
            <h4>2. SQL Processing</h4>
            <p>Analytical Views, Stored Procedures (<code>get_customer_full_profile</code>) & Automated Triggers</p>
          </div>

          <div className="arch-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="arch-step">
            <div className="arch-step-icon">
              <Server size={24} />
            </div>
            <h4>3. FastAPI Backend</h4>
            <p>REST API with connection pooling, Pydantic schemas, and structured error boundaries</p>
          </div>

          <div className="arch-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="arch-step">
            <div className="arch-step-icon">
              <BrainCircuit size={24} />
            </div>
            <h4>4. ML Engine</h4>
            <p>Scikit-learn Pipeline, 16 features, 5-Fold Stratified CV, 90.4% Accuracy, 0.976 ROC-AUC</p>
          </div>

          <div className="arch-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="arch-step">
            <div className="arch-step-icon">
              <LayoutDashboard size={24} />
            </div>
            <h4>5. React Dashboard</h4>
            <p>Executive KPI cards, interactive Recharts, customer 360 profiles & live ML prediction triggers</p>
          </div>
        </div>
      </Card>

      {/* Problem Statement & Objectives */}
      <div className="grid-2-col">
        <Card title="Problem Statement" subtitle="Business context & retention challenges">
          <p className="text-secondary leading-relaxed">
            Customer churn poses a significant financial challenge across SaaS, telecommunications, and digital subscription services.
            Acquiring new customers is 5 to 7 times more expensive than retaining existing accounts. Traditional databases store transaction
            logs passively without actionable predictive warning systems.
          </p>
          <p className="text-secondary leading-relaxed mt-2">
            This project solves the problem by transforming standard relational tables into a unified predictive analytics pipeline
            capable of calculating churn probabilities, diagnosing risk contributors, and providing timely intervention signals.
          </p>
        </Card>

        <Card title="Project Objectives" subtitle="Core design goals & technical deliverables">
          <ul className="about-objectives-list">
            <li>
              <CheckCircle2 size={16} className="text-success" />
              <span>Design a 3NF normalized MySQL database with foreign keys, indexes, views, and audit triggers.</span>
            </li>
            <li>
              <CheckCircle2 size={16} className="text-success" />
              <span>Generate realistic synthetic academic datasets with authentic non-linear behavioral correlations.</span>
            </li>
            <li>
              <CheckCircle2 size={16} className="text-success" />
              <span>Train and benchmark multiple classification algorithms using 5-Fold Stratified Cross-Validation.</span>
            </li>
            <li>
              <CheckCircle2 size={16} className="text-success" />
              <span>Provide real-time inference via FastAPI endpoints with zero mock data and automatic audit logging.</span>
            </li>
            <li>
              <CheckCircle2 size={16} className="text-success" />
              <span>Build an enterprise React dashboard with interactive visualizations and intervention workflows.</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Technology Stack Table (Requirement 22) */}
      <Card title="Comprehensive Technology Stack" subtitle="Production-grade technologies utilized across the system">
        <div className="tech-stack-grid">
          <div className="tech-card">
            <div className="tech-header">
              <Code2 size={20} className="text-primary" />
              <h4>Frontend Layer</h4>
            </div>
            <ul>
              <li><strong>React 19 & Vite 8</strong>: Modern reactive single-page application</li>
              <li><strong>React Router v7</strong>: Declarative route management across 13 pages</li>
              <li><strong>Recharts 3</strong>: Interactive SVG data visualizations</li>
              <li><strong>Lucide React</strong>: Crisp vector iconography</li>
              <li><strong>Vanilla CSS</strong>: Tailored glassmorphism and modern design system</li>
            </ul>
          </div>

          <div className="tech-card">
            <div className="tech-header">
              <Server size={20} className="text-success" />
              <h4>Backend Layer</h4>
            </div>
            <ul>
              <li><strong>Python 3.12 & FastAPI</strong>: High-performance asynchronous REST API</li>
              <li><strong>Uvicorn ASGI</strong>: Production-ready web server</li>
              <li><strong>Pydantic v2</strong>: Strict schema validation and data serialization</li>
              <li><strong>Python-Dotenv</strong>: Secure credential management</li>
            </ul>
          </div>

          <div className="tech-card">
            <div className="tech-header">
              <Database size={20} className="text-warning" />
              <h4>Database Layer</h4>
            </div>
            <ul>
              <li><strong>MySQL 8.0</strong>: ACID-compliant relational storage engine</li>
              <li><strong>SQL Views</strong>: <code>customer_churn_view</code>, <code>subscription_churn_summary</code></li>
              <li><strong>Stored Procedures</strong>: <code>get_customer_full_profile</code>, <code>get_high_risk_customers</code></li>
              <li><strong>Triggers</strong>: Automated audit logging into <code>activity_logs</code></li>
            </ul>
          </div>

          <div className="tech-card">
            <div className="tech-header">
              <BrainCircuit size={20} className="text-danger" />
              <h4>Machine Learning Engine</h4>
            </div>
            <ul>
              <li><strong>Scikit-learn</strong>: Preprocessing ColumnTransformer & Classifiers</li>
              <li><strong>Pandas & NumPy</strong>: In-memory data manipulation and vectorization</li>
              <li><strong>Joblib</strong>: Efficient pipeline persistence & serialization</li>
              <li><strong>StratifiedKFold</strong>: Rigorous 5-fold cross-validation</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* DBMS & Machine Learning Features */}
      <div className="grid-2-col">
        <Card title="DBMS Concepts Demonstrated" subtitle="Core database management engineering applied">
          <div className="chips-wrap">
            <span className="concept-chip">Database Normalization (3NF)</span>
            <span className="concept-chip">Foreign Key Cascades</span>
            <span className="concept-chip">Multi-Column Indexes</span>
            <span className="concept-chip">Complex SQL Joins</span>
            <span className="concept-chip">Materialized Views</span>
            <span className="concept-chip">Stored Procedures with IN params</span>
            <span className="concept-chip">Automated Audit Triggers</span>
            <span className="concept-chip">Connection Pooling</span>
            <span className="concept-chip">Parameterized SQL Queries</span>
          </div>
        </Card>

        <Card title="Future Scope & Enhancements" subtitle="Potential research and production extensions">
          <ul className="about-objectives-list">
            <li>
              <Sparkles size={16} className="text-primary" />
              <span>Deep Learning LSTM models for temporal sequential transaction logs.</span>
            </li>
            <li>
              <Sparkles size={16} className="text-primary" />
              <span>Automated retention coupon generation linked to high-risk alerts.</span>
            </li>
            <li>
              <Sparkles size={16} className="text-primary" />
              <span>Webhook notifications (Slack/Email) triggered by MySQL deletion triggers.</span>
            </li>
            <li>
              <Sparkles size={16} className="text-primary" />
              <span>Real-time WebSocket streaming replacing HTTP background polling.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
