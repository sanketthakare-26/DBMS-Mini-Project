import { useState, useEffect } from 'react';
import { Receipt, RefreshCw } from 'lucide-react';
import { getPaymentAnalytics, getPayments } from '../services/api';
import {
  Card,
  SkeletonLoader,
  ErrorState,
  formatCurrency,
} from '../components/shared';

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState([]);
  const [payments, setPayments] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, payData] = await Promise.all([
        getPaymentAnalytics(),
        getPayments({ limit: 100 }),
      ]);
      setSummary(sumData);
      setPayments(payData);
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
          <h1 className="page-heading">Payments & Billing</h1>
          <p className="page-lead">
            Payment methods, delay frequencies, and transaction records from MySQL
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
            title="Payment Behavior Summary (SQL View)"
            subtitle="Aggregated from MySQL payments table joined with churn_labels"
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
                    <th>Avg Monthly Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((p, idx) => (
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
                      <td>
                        <span className={p.avg_payment_delays > 1 ? 'text-danger' : ''}>
                          {p.avg_payment_delays} delays
                        </span>
                      </td>
                      <td>
                        <span className={p.avg_failed_payments > 0.5 ? 'text-danger' : ''}>
                          {p.avg_failed_payments} fails
                        </span>
                      </td>
                      <td>{formatCurrency(p.avg_monthly_payment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title="Customer Payment Records"
            subtitle="Individual payment logs from MySQL payments table"
          >
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Customer</th>
                    <th>Monthly Fee</th>
                    <th>Total Paid (LTV)</th>
                    <th>Payment Delays</th>
                    <th>Failed Payments</th>
                    <th>Payment Method</th>
                    <th>Last Payment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.payment_id}>
                      <td>#{p.payment_id}</td>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">{p.customer_name}</span>
                          <span className="customer-code">{p.customer_code}</span>
                        </div>
                      </td>
                      <td>{formatCurrency(p.monthly_payment)}</td>
                      <td className="font-bold">{formatCurrency(p.total_payment)}</td>
                      <td>
                        <span className={p.payment_delays > 0 ? 'text-danger font-semibold' : ''}>
                          {p.payment_delays}
                        </span>
                      </td>
                      <td>
                        <span className={p.failed_payments > 0 ? 'text-danger font-semibold' : ''}>
                          {p.failed_payments}
                        </span>
                      </td>
                      <td>{p.payment_method}</td>
                      <td>{p.last_payment_date || 'N/A'}</td>
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
