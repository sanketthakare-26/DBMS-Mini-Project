import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Smile,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  getAnalyticsOverview,
  getChurnAnalytics,
  getHighRiskPredictions,
  getSubscriptionAnalytics,
} from '../services/api';
import {
  StatCard,
  Card,
  RiskBadge,
  PlanBadge,
  SkeletonLoader,
  ErrorState,
  formatPercent,
  formatCurrency,
} from '../components/shared';

const RISK_COLORS = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
};

const CHURN_PIE_COLORS = ['#10b981', '#ef4444'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [subSummary, setSubSummary] = useState([]);
  const [highRiskList, setHighRiskList] = useState([]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, cd, subs, hr] = await Promise.all([
        getAnalyticsOverview(),
        getChurnAnalytics(),
        getSubscriptionAnalytics(),
        getHighRiskPredictions(),
      ]);
      setOverview(ov);
      setChurnData(cd);
      setSubSummary(subs);
      setHighRiskList(hr.slice(0, 6));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-heading">Executive Dashboard</h1>
        <p className="page-lead">Loading real-time customer churn metrics from MySQL...</p>
        <div className="grid-cards-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="stat-card">
              <SkeletonLoader rows={2} height={20} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorState message={error} onRetry={loadDashboardData} />
      </div>
    );
  }

  // Prep chart data
  const churnPieData = [
    { name: 'Active Customers', value: overview?.retained_customers || 0 },
    { name: 'Churned Customers', value: overview?.churned_customers || 0 },
  ];

  const riskPieData = (churnData?.risk_distribution || []).map((item) => ({
    name: `${item.risk_level} Risk`,
    value: item.count,
    risk: item.risk_level,
    avgProb: item.avg_probability_pct,
  }));

  // Group subSummary by plan_name for clean bar chart
  const planChartData = (subSummary || []).reduce((acc, row) => {
    const existing = acc.find((p) => p.plan_name === row.plan_name);
    if (existing) {
      existing.total_customers += row.total_customers;
      existing.churned_customers += row.churned_customers;
    } else {
      acc.push({
        plan_name: row.plan_name,
        total_customers: row.total_customers,
        churned_customers: row.churned_customers,
        churn_rate_pct: row.churn_rate_pct,
      });
    }
    return acc;
  }, []);

  return (
    <div className="page-container">
      {/* Top Banner */}
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">Dashboard Overview</h1>
          <p className="page-lead">
            Live customer metrics, risk distribution, and retention analytics
          </p>
        </div>
        <Link to="/prediction" className="btn btn-primary btn-sm">
          <span>⚡</span> Predict Churn
        </Link>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid-cards-4">
        <StatCard
          icon={Users}
          iconColor="#6366f1"
          label="Total Customers"
          value={(overview?.total_customers || 0).toLocaleString()}
          sub="Registered accounts in MySQL"
        />
        <StatCard
          icon={UserCheck}
          iconColor="#10b981"
          label="Active / Retained"
          value={(overview?.retained_customers || 0).toLocaleString()}
          sub={`${formatPercent(100 - (overview?.churn_rate_pct || 0))} retention rate`}
        />
        <StatCard
          icon={UserX}
          iconColor="#ef4444"
          label="Churned Customers"
          value={(overview?.churned_customers || 0).toLocaleString()}
          sub={`Overall churn rate: ${formatPercent(overview?.churn_rate_pct)}`}
        />
        <StatCard
          icon={AlertOctagon}
          iconColor="#dc2626"
          label="High Risk Customers"
          value={(overview?.high_risk_customers_count || 0).toLocaleString()}
          sub="Probability > 60% (Urgent action)"
        />
        <StatCard
          icon={TrendingUp}
          iconColor="#3b82f6"
          label="Total Revenue Collected"
          value={formatCurrency(overview?.total_revenue)}
          sub={`Avg Monthly: ${formatCurrency(overview?.avg_monthly_charge)}`}
        />
        <StatCard
          icon={Smile}
          iconColor="#059669"
          label="Avg Satisfaction Score"
          value={`${overview?.avg_satisfaction_score || 0} / 5.0`}
          sub={`Avg Complaints: ${overview?.avg_complaints || 0} / user`}
        />
        <StatCard
          icon={AlertTriangle}
          iconColor="#d97706"
          label="Avg Usage Hours"
          value={`${overview?.avg_usage_hours || 0} hrs/mo`}
          sub={`Logins: ${overview?.avg_monthly_logins || 0} / month`}
        />
        <StatCard
          icon={ShieldCheck}
          iconColor="#8b5cf6"
          label="Active Subscriptions"
          value={(overview?.active_subscriptions || 0).toLocaleString()}
          sub="Status: Active / Auto-Renew"
        />
      </div>

      {/* Row 1 Charts: Churned vs Active & Risk Distribution */}
      <div className="grid-2-col">
        <Card title="Customer Retention vs Churn" subtitle="Ground-truth status breakdown from MySQL churn_labels">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={churnPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={55}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(1)}%)`}
                >
                  {churnPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHURN_PIE_COLORS[index % CHURN_PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [val, 'Customers']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Model Risk Distribution" subtitle="Customer risk tiers computed by Machine Learning pipeline">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskPieData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  formatter={(val, name, item) => [
                    `${val} Customers (Avg Prob: ${item.payload.avgProb}%)`,
                    'Count',
                  ]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 2 Charts: Churn by Plan & Age Breakdown */}
      <div className="grid-2-col">
        <Card title="Churn by Subscription Plan" subtitle="Total vs Churned customer headcount by tier">
          <div style={{ height: 270 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planChartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="plan_name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_customers" name="Total Customers" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churned_customers" name="Churned" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Churn Rate by Age Group" subtitle="Demographic risk trends from customer_churn_view">
          <div style={{ height: 270 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnData?.by_age_group || []} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="age_group" stroke="#64748b" />
                <YAxis stroke="#64748b" unit="%" />
                <Tooltip formatter={(val) => [`${val}%`, 'Churn Rate']} />
                <Bar dataKey="churn_rate" name="Churn Rate %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* High-Risk Customers Preview Table */}
      <Card
        title="High-Risk Customers Requiring Intervention"
        subtitle="Customers flagged with High risk (>60% probability) by the ML prediction engine"
        action={
          <Link to="/high-risk" className="link-action">
            View All High-Risk <ArrowRight size={14} />
          </Link>
        }
      >
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan</th>
                <th>Location</th>
                <th>Payment Delays</th>
                <th>Complaints</th>
                <th>Satisfaction</th>
                <th>Churn Probability</th>
                <th>Risk Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {highRiskList.map((c) => (
                <tr key={c.customer_id}>
                  <td>
                    <div className="customer-cell">
                      <span className="customer-name">{c.name}</span>
                      <span className="customer-code">{c.customer_code}</span>
                    </div>
                  </td>
                  <td>
                    <PlanBadge plan={c.plan_name} />
                  </td>
                  <td>{c.location}</td>
                  <td>
                    <span className={c.payment_delays > 2 ? 'text-danger font-bold' : ''}>
                      {c.payment_delays} delays
                    </span>
                  </td>
                  <td>{c.complaint_count}</td>
                  <td>{c.satisfaction_score} / 5.0</td>
                  <td>
                    <div className="prob-meter">
                      <div
                        className="prob-fill high"
                        style={{ width: `${Math.round(c.churn_probability * 100)}%` }}
                      />
                      <span>{(c.churn_probability * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>
                    <RiskBadge risk={c.risk_level} />
                  </td>
                  <td>
                    <Link
                      to={`/customers/${c.customer_id}`}
                      className="btn btn-outline btn-xs"
                    >
                      Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
