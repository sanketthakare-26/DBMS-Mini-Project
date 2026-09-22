import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  Play,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { getHighRiskPredictions, predictChurn } from '../services/api';
import {
  Card,
  RiskBadge,
  PlanBadge,
  SkeletonLoader,
  ErrorState,
  EmptyState,
  formatPercent,
} from '../components/shared';
import { useToast } from '../components/Toast';

export default function HighRiskPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highRiskCustomers, setHighRiskCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [repredictingId, setRepredictingId] = useState(null);
  const { addToast } = useToast();

  const loadHighRisk = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHighRiskPredictions();
      setHighRiskCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHighRisk();
  }, []);

  const handleRepredict = async (customerId, name) => {
    setRepredictingId(customerId);
    try {
      const res = await predictChurn({ customer_id: customerId });
      addToast(
        `Re-predicted ${name}: ${formatPercent(res.churn_probability * 100)} (${res.risk_level} Risk)`,
        res.risk_level === 'High' ? 'warning' : 'success'
      );
      loadHighRisk();
    } catch (err) {
      addToast(`Prediction error: ${err.message}`, 'error');
    } finally {
      setRepredictingId(null);
    }
  };

  const filteredList = highRiskCustomers.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_code?.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-heading">High-Risk Customers</h1>
            <span className="badge-high-risk-pill">
              <ShieldAlert size={14} /> {highRiskCustomers.length} At-Risk
            </span>
          </div>
          <p className="page-lead">
            Accounts with &gt;60% predicted churn probability requiring attention
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadHighRisk} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh List
        </button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadHighRisk} />
      ) : (
        <Card>
          <div className="filter-bar">
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search high-risk customers by name, code, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="results-summary">
              Showing <strong>{filteredList.length}</strong> urgent cases
            </div>
          </div>

          {loading ? (
            <SkeletonLoader rows={8} height={35} />
          ) : filteredList.length === 0 ? (
            <EmptyState
              message="No High-Risk Customers Found"
              subtext="Either all customer churn probabilities are below 60%, or filter query did not match."
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Location</th>
                    <th>Plan</th>
                    <th>Payment Delays</th>
                    <th>Complaints</th>
                    <th>Satisfaction</th>
                    <th>Churn Probability</th>
                    <th>Risk Tier</th>
                    <th>Intervention Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((c) => (
                    <tr key={c.customer_id} className="row-high-risk">
                      <td>
                        <div className="customer-cell">
                          <Link to={`/customers/${c.customer_id}`} className="customer-name-link">
                            {c.name}
                          </Link>
                          <span className="customer-code">{c.customer_code}</span>
                        </div>
                      </td>
                      <td>{c.location}</td>
                      <td>
                        <PlanBadge plan={c.plan_name} />
                      </td>
                      <td>
                        <span className="text-danger font-bold">{c.payment_delays} delays</span>
                      </td>
                      <td>
                        <span className={c.complaint_count > 1 ? 'text-danger font-semibold' : ''}>
                          {c.complaint_count} issues
                        </span>
                      </td>
                      <td>
                        <span className={c.satisfaction_score < 3.0 ? 'text-danger font-bold' : ''}>
                          {c.satisfaction_score} / 5.0
                        </span>
                      </td>
                      <td>
                        <div className="prob-meter">
                          <div
                            className="prob-fill high"
                            style={{ width: `${Math.round(c.churn_probability * 100)}%` }}
                          />
                          <span className="font-bold text-danger">
                            {(c.churn_probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <RiskBadge risk={c.risk_level} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link
                            to={`/customers/${c.customer_id}`}
                            className="btn btn-outline btn-xs"
                            title="View full 360-degree profile"
                          >
                            <ExternalLink size={13} /> Profile
                          </Link>
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleRepredict(c.customer_id, c.name)}
                            disabled={repredictingId === c.customer_id}
                            title="Run live ML inference on this customer"
                          >
                            <Play size={12} className={repredictingId === c.customer_id ? 'spin' : ''} />
                            <span>{repredictingId === c.customer_id ? 'Running...' : 'Re-Predict'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
