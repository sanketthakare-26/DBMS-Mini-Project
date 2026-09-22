import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Edit2,
  Save,
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  Activity,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { getCustomerProfile, getCustomerPredictions, predictChurn, updateCustomer } from '../services/api';
import {
  Card,
  RiskBadge,
  ChurnBadge,
  PlanBadge,
  SkeletonLoader,
  ErrorState,
  formatCurrency,
  formatPercent,
  formatTime,
} from '../components/shared';
import { useToast } from '../components/Toast';

export default function CustomerProfilePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [predicting, setPredicting] = useState(false);
  const { addToast } = useToast();

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profData, predData] = await Promise.all([
        getCustomerProfile(id),
        getCustomerPredictions(id),
      ]);
      setProfile(profData);
      setPredictions(predData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const handleRunPrediction = async () => {
    setPredicting(true);
    try {
      const res = await predictChurn({ customer_id: Number(id) });
      addToast(
        `Live ML prediction completed: ${formatPercent(res.churn_probability * 100)} (${res.risk_level} Risk) via ${res.model_name}`,
        res.risk_level === 'High' ? 'warning' : 'success',
        6000
      );
      loadProfile();
    } catch (err) {
      addToast(`Prediction error: ${err.message}`, 'error');
    } finally {
      setPredicting(false);
    }
  };

  const openEditModal = () => {
    if (!profile) return;
    setEditData({
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      location: profile.location,
      plan_name: profile.plan_name || 'Standard',
      billing_cycle: profile.billing_cycle || 'Monthly',
      monthly_charge: Number(profile.monthly_charge) || 49.99,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    try {
      await updateCustomer(Number(id), editData);
      addToast(`Profile for "${editData.name}" updated in MySQL!`, 'success');
      setShowEditModal(false);
      loadProfile();
    } catch (err) {
      addToast(`Update failed: ${err.message}`, 'error');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Link to="/customers" className="back-link">
          <ArrowLeft size={16} /> Back to Customers
        </Link>
        <SkeletonLoader rows={12} height={28} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-container">
        <Link to="/customers" className="back-link">
          <ArrowLeft size={16} /> Back to Customers
        </Link>
        <ErrorState message={error || 'Customer profile not found'} onRetry={loadProfile} />
      </div>
    );
  }

  const probPercent = Math.round((profile.churn_probability || 0) * 100);
  const riskClass = (profile.risk_level || 'low').toLowerCase();

  return (
    <div className="page-container">
      {/* Navigation & Header */}
      <div className="page-header-row">
        <div>
          <Link to="/customers" className="back-link">
            <ArrowLeft size={16} /> Back to Customer List
          </Link>
          <div className="profile-title-wrap">
            <h1 className="page-heading">{profile.name}</h1>
            <span className="profile-code-pill">{profile.customer_code}</span>
            <ChurnBadge churn={profile.churn} />
          </div>
          <p className="page-lead">
            Registered on {profile.registration_date} • {profile.location} • {profile.gender}, {profile.age} years old
          </p>
        </div>

        <div className="page-header-actions">
          <button
            className="btn btn-secondary"
            onClick={openEditModal}
            title="Edit customer info"
          >
            <Edit2 size={14} /> Edit Customer
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRunPrediction}
            disabled={predicting}
          >
            <Play size={14} className={predicting ? 'spin' : ''} />
            <span>{predicting ? 'Evaluating...' : 'Run Prediction'}</span>
          </button>
        </div>
      </div>

      {/* Visual Churn Risk Card (Hero Section) */}
      <div className={`risk-hero-card risk-${riskClass}`}>
        <div className="risk-hero-left">
          <div className="risk-hero-badge-wrap">
            <span className="risk-hero-label">PREDICTED CHURN RISK</span>
            <RiskBadge risk={profile.risk_level} />
          </div>
          <div className="risk-hero-probability">
            <span className="prob-big-num">{probPercent}%</span>
            <span className="prob-desc">Probability of Churn</span>
          </div>
          <div className="risk-hero-bar-bg">
            <div className={`risk-hero-bar-fill ${riskClass}`} style={{ width: `${probPercent}%` }} />
          </div>
          <div className="risk-hero-markers">
            <span>0% (Low)</span>
            <span>30%</span>
            <span>60%</span>
            <span>100% (High)</span>
          </div>
        </div>

        <div className="risk-hero-right">
          <h4>Model Diagnostic Summary</h4>
          <p>
            Evaluated by <strong>{profile.model_name || 'Machine Learning Engine'}</strong> on{' '}
            {profile.prediction_date ? formatTime(profile.prediction_date) : 'Recent inference'}.
          </p>
          <div className="risk-factors-list">
            <div className="factor-item">
              <span className="factor-label">Support Tickets:</span>
              <span className="factor-val">{profile.support_tickets} logged</span>
            </div>
            <div className="factor-item">
              <span className="factor-label">Payment Delays:</span>
              <span className="factor-val">{profile.payment_delays} occurrences</span>
            </div>
            <div className="factor-item">
              <span className="factor-label">Monthly Usage:</span>
              <span className="factor-val">{profile.usage_hours} hrs / month</span>
            </div>
            <div className="factor-item">
              <span className="factor-label">Satisfaction:</span>
              <span className="factor-val">{profile.satisfaction_score} / 5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Multi-Dimensional Cards: Subscription, Usage, Payments, Complaints */}
      <div className="grid-2-col">
        {/* Card 1: Subscription Info */}
        <Card title="Subscription & Plan Details" subtitle="Active plan contract from subscriptions table">
          <div className="profile-details-grid">
            <div className="detail-item">
              <span className="detail-label">Current Plan</span>
              <span className="detail-val">
                <PlanBadge plan={profile.plan_name} />
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Billing Cycle</span>
              <span className="detail-val">{profile.billing_cycle}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Monthly Charge</span>
              <span className="detail-val font-bold">{formatCurrency(profile.monthly_charge)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Subscription Tenure</span>
              <span className="detail-val">{profile.subscription_months} months</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Contract Start</span>
              <span className="detail-val">{profile.subscription_start}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Renewal Status</span>
              <span className="detail-val status-badge-pill">{profile.renewal_status}</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Usage Behavior */}
        <Card title="Product Usage & Activity" subtitle="Engagement metrics from usage table">
          <div className="profile-details-grid">
            <div className="detail-item">
              <span className="detail-label">Monthly Logins</span>
              <span className="detail-val">{profile.monthly_logins} times</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Usage Hours</span>
              <span className="detail-val font-bold">{profile.usage_hours} hrs</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Monthly Sessions</span>
              <span className="detail-val">{profile.monthly_sessions} sessions</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Transactions Count</span>
              <span className="detail-val">{profile.transactions_count} orders</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Login Date</span>
              <span className="detail-val">{profile.last_login || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Engagement Status</span>
              <span className="detail-val">
                {profile.monthly_logins > 20 ? (
                  <span className="text-success font-semibold">Active User</span>
                ) : (
                  <span className="text-warning font-semibold">Low Activity</span>
                )}
              </span>
            </div>
          </div>
        </Card>

        {/* Card 3: Payments & Billing History */}
        <Card title="Billing & Payment Behavior" subtitle="Financial health metrics from payments table">
          <div className="profile-details-grid">
            <div className="detail-item">
              <span className="detail-label">Monthly Payment</span>
              <span className="detail-val">{formatCurrency(profile.monthly_payment)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Lifetime Value (LTV)</span>
              <span className="detail-val font-bold">{formatCurrency(profile.total_payment)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Payment Delays</span>
              <span className={`detail-val ${profile.payment_delays > 0 ? 'text-danger font-bold' : ''}`}>
                {profile.payment_delays} instances
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Failed Payments</span>
              <span className={`detail-val ${profile.failed_payments > 0 ? 'text-danger font-bold' : ''}`}>
                {profile.failed_payments} failed
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Payment Method</span>
              <span className="detail-val">{profile.payment_method}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Payment Date</span>
              <span className="detail-val">{profile.last_payment_date || 'N/A'}</span>
            </div>
          </div>
        </Card>

        {/* Card 4: Complaints & Customer Service */}
        <Card title="Customer Service & Complaints" subtitle="Support history from complaints table">
          <div className="profile-details-grid">
            <div className="detail-item">
              <span className="detail-label">Complaint Count</span>
              <span className={`detail-val ${profile.complaint_count > 1 ? 'text-danger font-bold' : ''}`}>
                {profile.complaint_count} complaints
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Support Tickets</span>
              <span className="detail-val">{profile.support_tickets} tickets</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Avg Resolution Days</span>
              <span className="detail-val">{profile.average_resolution_days} days</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Satisfaction Score</span>
              <span className="detail-val font-bold">
                {profile.satisfaction_score} / 5.0
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Complaint Date</span>
              <span className="detail-val">{profile.last_complaint_date || 'None'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Churn Status</span>
              <span className="detail-val">
                <ChurnBadge churn={profile.churn} />
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Chronological Prediction History Table */}
      <Card
        title="Prediction Audit History"
        subtitle="All historical ML churn inferences recorded for this customer in MySQL"
      >
        {predictions.length === 0 ? (
          <p className="text-muted">No historical predictions logged yet for this customer.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prediction ID</th>
                  <th>Churn Probability</th>
                  <th>Risk Tier</th>
                  <th>Inference Model</th>
                  <th>Execution Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr key={p.prediction_id}>
                    <td>#{p.prediction_id}</td>
                    <td>
                      <div className="prob-meter">
                        <div
                          className={`prob-fill ${(p.risk_level || '').toLowerCase()}`}
                          style={{ width: `${Math.round((p.churn_probability || 0) * 100)}%` }}
                        />
                        <span>{((p.churn_probability || 0) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <RiskBadge risk={p.risk_level} />
                    </td>
                    <td>
                      <code>{p.model_name}</code>
                    </td>
                    <td>{formatTime(p.prediction_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Customer Modal */}
      {showEditModal && profile && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Customer — {profile.name}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    required
                    value={editData.age || ''}
                    onChange={(e) => setEditData({ ...editData, age: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={editData.gender || 'Male'}
                    onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                    className="form-input"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    required
                    value={editData.location || ''}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Subscription Plan</label>
                  <select
                    value={editData.plan_name || 'Standard'}
                    onChange={(e) => {
                      const plan = e.target.value;
                      const charges = { Basic: 19.99, Standard: 49.99, Premium: 99.99, Enterprise: 199.99 };
                      setEditData({ ...editData, plan_name: plan, monthly_charge: charges[plan] || editData.monthly_charge });
                    }}
                    className="form-input"
                  >
                    <option value="Basic">Basic ($19.99)</option>
                    <option value="Standard">Standard ($49.99)</option>
                    <option value="Premium">Premium ($99.99)</option>
                    <option value="Enterprise">Enterprise ($199.99)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Billing Cycle</label>
                  <select
                    value={editData.billing_cycle || 'Monthly'}
                    onChange={(e) => setEditData({ ...editData, billing_cycle: e.target.value })}
                    className="form-input"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Monthly Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.monthly_charge || ''}
                    onChange={(e) => setEditData({ ...editData, monthly_charge: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="edit-info-note">
                💾 Changes are written to MySQL. The profile page will refresh automatically after saving.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isEditSubmitting}
                >
                  <Save size={15} />
                  {isEditSubmitting ? 'Saving to MySQL...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
