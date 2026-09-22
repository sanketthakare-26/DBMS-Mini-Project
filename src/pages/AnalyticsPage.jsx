import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  getAnalyticsOverview,
  getChurnAnalytics,
  getSubscriptionAnalytics,
  getPaymentAnalytics,
  getComplaintAnalytics,
} from '../services/api';
import {
  Card,
  SkeletonLoader,
  ErrorState,
  formatCurrency,
  formatPercent,
} from '../components/shared';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [subSummary, setSubSummary] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState([]);
  const [complaintSummary, setComplaintSummary] = useState([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState('churn'); // 'churn' | 'subscription' | 'payments' | 'complaints'

  const loadAllAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, cd, subs, pay, comp] = await Promise.all([
        getAnalyticsOverview(),
        getChurnAnalytics(),
        getSubscriptionAnalytics(),
        getPaymentAnalytics(),
        getComplaintAnalytics(),
      ]);
      setOverview(ov);
      setChurnData(cd);
      setSubSummary(subs);
      setPaymentSummary(pay);
      setComplaintSummary(comp);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-heading">Customer Analytics & Insights</h1>
        <p className="page-lead">Loading multidimensional SQL analytical views from MySQL...</p>
        <SkeletonLoader rows={10} height={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorState message={error} onRetry={loadAllAnalytics} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">Analytics & Insights</h1>
          <p className="page-lead">
            Multidimensional churn, payment, and complaint breakdowns from MySQL
          </p>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'churn' ? 'active' : ''}`}
          onClick={() => setActiveTab('churn')}
        >
          Churn & Demographics
        </button>
        <button
          className={`tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          Subscription Performance
        </button>
        <button
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payment Delinquency
        </button>
        <button
          className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          Support & Satisfaction
        </button>
      </div>

      {/* Tab 1: Churn & Demographics */}
      {activeTab === 'churn' && (
        <div className="tab-content">
          <div className="grid-2-col">
            <Card
              title="Churn Rate by Geographic Location"
              subtitle="Top metropolitan markets evaluated from customer_churn_view"
            >
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={churnData?.by_location || []} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="location" angle={-25} textAnchor="end" stroke="#64748b" />
                    <YAxis stroke="#64748b" unit="%" />
                    <Tooltip formatter={(val) => [`${val}%`, 'Churn Rate']} />
                    <Bar dataKey="churn_rate" name="Churn Rate %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card
              title="Churn Rate by Age Demographics"
              subtitle="Comparison of customer age tiers against retention likelihood"
            >
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={churnData?.by_age_group || []} margin={{ top: 15, right: 20, left: 10, bottom: 10 }}>
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
        </div>
      )}

      {/* Tab 2: Subscription Performance */}
      {activeTab === 'subscription' && (
        <div className="tab-content">
          <Card
            title="Subscription Churn Summary View"
            subtitle="Real SQL View subscription_churn_summary aggregating customer volume, churn %, and revenue"
          >
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plan Name</th>
                    <th>Billing Cycle</th>
                    <th>Total Customers</th>
                    <th>Retained</th>
                    <th>Churned</th>
                    <th>Churn Rate %</th>
                    <th>Avg Monthly Fee</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {subSummary.map((s, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{s.plan_name}</strong>
                      </td>
                      <td>{s.billing_cycle}</td>
                      <td>{s.total_customers}</td>
                      <td className="text-success font-semibold">{s.retained_customers}</td>
                      <td className="text-danger font-semibold">{s.churned_customers}</td>
                      <td>
                        <span className={s.churn_rate_pct > 25 ? 'text-danger font-bold' : ''}>
                          {s.churn_rate_pct}%
                        </span>
                      </td>
                      <td>{formatCurrency(s.avg_monthly_charge)}</td>
                      <td>{formatCurrency(s.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Payment Delinquency */}
      {activeTab === 'payments' && (
        <div className="tab-content">
          <Card
            title="Payment Behavior Summary View"
            subtitle="Real SQL View payment_behavior_summary evaluating payment methods and delay correlation"
          >
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th>Total Customers</th>
                    <th>Churned Count</th>
                    <th>Churn Rate %</th>
                    <th>Avg Payment Delays</th>
                    <th>Avg Failed Payments</th>
                    <th>Avg Monthly Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentSummary.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{p.payment_method}</strong>
                      </td>
                      <td>{p.total_customers}</td>
                      <td className="text-danger font-semibold">{p.churned_customers}</td>
                      <td>
                        <span className={p.churn_rate_pct > 30 ? 'text-danger font-bold' : ''}>
                          {p.churn_rate_pct}%
                        </span>
                      </td>
                      <td>{p.avg_payment_delays} delays</td>
                      <td>{p.avg_failed_payments} fails</td>
                      <td>{formatCurrency(p.avg_monthly_payment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Complaints & Support */}
      {activeTab === 'complaints' && (
        <div className="tab-content">
          <Card
            title="Complaint Churn Summary View"
            subtitle="Real SQL View complaint_churn_summary correlating satisfaction score tiers with churn risk"
          >
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Satisfaction Score Tier</th>
                    <th>Total Customers</th>
                    <th>Churned Count</th>
                    <th>Churn Rate %</th>
                    <th>Avg Complaints</th>
                    <th>Avg Support Tickets</th>
                    <th>Avg Resolution Days</th>
                    <th>Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {complaintSummary.map((c, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{c.satisfaction_tier}</strong>
                      </td>
                      <td>{c.total_customers}</td>
                      <td className="text-danger font-semibold">{c.churned_customers}</td>
                      <td>
                        <span className={c.churn_rate_pct > 35 ? 'text-danger font-bold' : 'text-success font-bold'}>
                          {c.churn_rate_pct}%
                        </span>
                      </td>
                      <td>{c.avg_complaints}</td>
                      <td>{c.avg_support_tickets}</td>
                      <td>{c.avg_resolution_days} days</td>
                      <td>{c.avg_satisfaction_score} / 5.0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
