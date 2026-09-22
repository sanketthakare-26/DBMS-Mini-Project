import { useState, useEffect } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import { getSubscriptionAnalytics, getSubscriptions } from '../services/api';
import {
  Card,
  PlanBadge,
  SkeletonLoader,
  ErrorState,
  formatCurrency,
} from '../components/shared';

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, subsData] = await Promise.all([
        getSubscriptionAnalytics(),
        getSubscriptions({ limit: 100 }),
      ]);
      setSummary(sumData);
      setSubscriptions(subsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">Subscriptions</h1>
          <p className="page-lead">
            Plan tiers, billing frequencies, and subscription revenue
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : loading ? (
        <SkeletonLoader rows={8} height={32} />
      ) : (
        <>
          <Card
            title="Subscription Churn Summary (SQL View)"
            subtitle="Aggregated by Plan Name and Billing Cycle from subscriptions table"
          >
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plan</th>
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
                  {summary.map((s, idx) => (
                    <tr key={idx}>
                      <td>
                        <PlanBadge plan={s.plan_name} />
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

          <Card
            title="Customer Subscriptions Log"
            subtitle="Individual subscriber contracts linked to MySQL customers"
          >
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subscription ID</th>
                    <th>Customer</th>
                    <th>Plan</th>
                    <th>Billing Cycle</th>
                    <th>Monthly Charge</th>
                    <th>Tenure</th>
                    <th>Contract Start</th>
                    <th>Renewal Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.subscription_id}>
                      <td>#{sub.subscription_id}</td>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">{sub.customer_name}</span>
                          <span className="customer-code">{sub.customer_code}</span>
                        </div>
                      </td>
                      <td>
                        <PlanBadge plan={sub.plan_name} />
                      </td>
                      <td>{sub.billing_cycle}</td>
                      <td>{formatCurrency(sub.monthly_charge)}</td>
                      <td>{sub.subscription_months} months</td>
                      <td>{sub.subscription_start}</td>
                      <td>
                        <span className="status-badge-pill">{sub.renewal_status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
