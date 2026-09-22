import { useState, useEffect } from 'react';
import { MessageSquareWarning, RefreshCw, Smile } from 'lucide-react';
import { getComplaintAnalytics, getComplaints } from '../services/api';
import {
  Card,
  SkeletonLoader,
  ErrorState,
} from '../components/shared';

export default function ComplaintsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, compData] = await Promise.all([
        getComplaintAnalytics(),
        getComplaints({ limit: 100 }),
      ]);
      setSummary(sumData);
      setComplaints(compData);
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
          <h1 className="page-heading">Support & Complaints</h1>
          <p className="page-lead">
            Customer feedback, resolution times, and satisfaction scores from MySQL
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
            title="Complaint Churn Summary (SQL View)"
            subtitle="Customer distribution and churn rate grouped by customer satisfaction tiers"
          >
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Satisfaction Tier</th>
                    <th>Total Customers</th>
                    <th>Churned Count</th>
                    <th>Churn Rate %</th>
                    <th>Avg Complaints</th>
                    <th>Avg Support Tickets</th>
                    <th>Avg Resolution Days</th>
                    <th>Avg Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((c, idx) => (
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
                      <td className="font-bold">{c.avg_satisfaction_score} / 5.0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title="Customer Support & Complaint Logs"
            subtitle="Granular service interaction records from MySQL complaints table"
          >
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Customer</th>
                    <th>Complaints Logged</th>
                    <th>Support Tickets</th>
                    <th>Resolution Time</th>
                    <th>Satisfaction Score</th>
                    <th>Last Complaint Date</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.complaint_id}>
                      <td>#{c.complaint_id}</td>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">{c.customer_name}</span>
                          <span className="customer-code">{c.customer_code}</span>
                        </div>
                      </td>
                      <td>
                        <span className={c.complaint_count > 1 ? 'text-danger font-bold' : ''}>
                          {c.complaint_count}
                        </span>
                      </td>
                      <td>{c.support_tickets} tickets</td>
                      <td>{c.average_resolution_days} days</td>
                      <td>
                        <span className={c.satisfaction_score < 3.0 ? 'text-danger font-bold' : 'text-success font-semibold'}>
                          {c.satisfaction_score} / 5.0
                        </span>
                      </td>
                      <td>{c.last_complaint_date || 'None'}</td>
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
