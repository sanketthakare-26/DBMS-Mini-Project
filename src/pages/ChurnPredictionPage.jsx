import { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Play,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Users,
} from 'lucide-react';
import { getCustomers, predictChurn, runAllPredictions } from '../services/api';
import {
  Card,
  RiskBadge,
  SkeletonLoader,
  ErrorState,
  formatPercent,
  formatTime,
} from '../components/shared';
import { useToast } from '../components/Toast';

export default function ChurnPredictionPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const { addToast } = useToast();

  // Form State for custom feature tweaking
  const [features, setFeatures] = useState({
    age: 35,
    gender: 'Female',
    plan_name: 'Premium',
    billing_cycle: 'Monthly',
    monthly_charge: 99.99,
    subscription_months: 6,
    monthly_logins: 10,
    usage_hours: 12.5,
    monthly_sessions: 15,
    transactions_count: 4,
    payment_delays: 2,
    failed_payments: 1,
    complaint_count: 2,
    support_tickets: 3,
    average_resolution_days: 4.5,
    satisfaction_score: 2.8,
  });

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getCustomers({ limit: 1000 });
        setCustomers(data);
        if (data.length > 0) {
          setSelectedCustomerId(data[0].customer_id);
        }
      } catch (err) {
        addToast(`Could not load customers for selector: ${err.message}`, 'error');
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, [addToast]);

  // Handle selecting a customer from dropdown
  const handleCustomerSelect = (id) => {
    setSelectedCustomerId(id);
    const found = customers.find((c) => String(c.customer_id) === String(id));
    if (found) {
      setFeatures((prev) => ({
        ...prev,
        age: found.age || 30,
        gender: found.gender || 'Male',
        plan_name: found.plan_name || 'Standard',
        billing_cycle: found.billing_cycle || 'Monthly',
        monthly_charge: Number(found.monthly_charge) || 49.99,
      }));
    }
  };

  // Predict Single Customer
  const handlePredict = async (e) => {
    e.preventDefault();
    setIsPredicting(true);
    try {
      const payload = {
        customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
        ...features,
      };
      const result = await predictChurn(payload);
      setPredictionResult(result);
      addToast(
        `Prediction calculated: ${formatPercent(result.churn_probability * 100)} (${result.risk_level} Risk)`,
        result.risk_level === 'High' ? 'warning' : 'success'
      );
    } catch (err) {
      addToast(`Prediction failed: ${err.message}`, 'error');
    } finally {
      setIsPredicting(false);
    }
  };

  // Run Batch Predictions
  const handleRunAll = async () => {
    setIsBatchRunning(true);
    try {
      const res = await runAllPredictions();
      setBatchResult(res);
      addToast(
        `Batch predictions completed on ${res.total_processed} customers!`,
        'success',
        6000
      );
    } catch (err) {
      addToast(`Batch prediction error: ${err.message}`, 'error');
    } finally {
      setIsBatchRunning(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">Churn Prediction</h1>
          <p className="page-lead">
            Evaluate individual customer risk or run inference across all accounts
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleRunAll}
          disabled={isBatchRunning}
        >
          <BrainCircuit size={15} className={isBatchRunning ? 'spin' : ''} />
          <span>{isBatchRunning ? 'Running...' : 'Run All Predictions'}</span>
        </button>
      </div>

      {/* Batch Result Banner if run */}
      {batchResult && (
        <div className="batch-summary-card">
          <div className="batch-header">
            <CheckCircle2 size={20} className="text-success" />
            <h3>Batch Inference Summary</h3>
            <span className="batch-date">{formatTime(batchResult.execution_date)}</span>
          </div>
          <div className="batch-grid">
            <div className="batch-item">
              <span className="batch-label">Total Processed</span>
              <span className="batch-val">{batchResult.total_processed}</span>
            </div>
            <div className="batch-item">
              <span className="batch-label text-success">Low Risk (≤30%)</span>
              <span className="batch-val">{batchResult.low_risk}</span>
            </div>
            <div className="batch-item">
              <span className="batch-label text-warning">Medium Risk (31-60%)</span>
              <span className="batch-val">{batchResult.medium_risk}</span>
            </div>
            <div className="batch-item">
              <span className="batch-label text-danger">High Risk (&gt;60%)</span>
              <span className="batch-val">{batchResult.high_risk}</span>
            </div>
            <div className="batch-item">
              <span className="batch-label">Average Probability</span>
              <span className="batch-val">{formatPercent(batchResult.average_churn_probability * 100)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2-col">
        {/* Left Form: Feature Inputs & Customer Picker */}
        <Card title="Customer Profile & Feature Inputs" subtitle="Select a registered customer or customize behavioral inputs">
          {loadingCustomers ? (
            <SkeletonLoader rows={6} height={30} />
          ) : (
            <form onSubmit={handlePredict}>
              <div className="form-group mb-4">
                <label className="font-semibold">Select Customer from MySQL:</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="form-input"
                >
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.name} ({c.customer_code}) — {c.location} • Plan: {c.plan_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={features.age}
                    onChange={(e) => setFeatures({ ...features, age: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Plan Name</label>
                  <select
                    value={features.plan_name}
                    onChange={(e) => setFeatures({ ...features, plan_name: e.target.value })}
                    className="form-input"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Monthly Logins</label>
                  <input
                    type="number"
                    min="0"
                    value={features.monthly_logins}
                    onChange={(e) => setFeatures({ ...features, monthly_logins: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Usage Hours / Month</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={features.usage_hours}
                    onChange={(e) => setFeatures({ ...features, usage_hours: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Payment Delays</label>
                  <input
                    type="number"
                    min="0"
                    value={features.payment_delays}
                    onChange={(e) => setFeatures({ ...features, payment_delays: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Failed Payments</label>
                  <input
                    type="number"
                    min="0"
                    value={features.failed_payments}
                    onChange={(e) => setFeatures({ ...features, failed_payments: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Complaint Count</label>
                  <input
                    type="number"
                    min="0"
                    value={features.complaint_count}
                    onChange={(e) => setFeatures({ ...features, complaint_count: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Support Tickets</label>
                  <input
                    type="number"
                    min="0"
                    value={features.support_tickets}
                    onChange={(e) => setFeatures({ ...features, support_tickets: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Satisfaction Score (1.0 to 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={features.satisfaction_score}
                    onChange={(e) => setFeatures({ ...features, satisfaction_score: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Subscription Tenure (Months)</label>
                  <input
                    type="number"
                    min="1"
                    value={features.subscription_months}
                    onChange={(e) => setFeatures({ ...features, subscription_months: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block mt-4"
                disabled={isPredicting}
              >
                <Play size={16} className={isPredicting ? 'spin' : ''} />
                <span>{isPredicting ? 'Evaluating ML Model...' : 'Calculate Churn Probability'}</span>
              </button>
            </form>
          )}
        </Card>

        {/* Right Panel: Prediction Results Showcase */}
        <div>
          <Card title="Prediction Diagnostic Result" subtitle="Live output produced by Scikit-learn classification engine">
            {predictionResult ? (
              <div className="prediction-showcase">
                <div className={`prediction-result-box risk-${(predictionResult.risk_level || 'low').toLowerCase()}`}>
                  <div className="pred-risk-header">
                    <span className="pred-risk-title">PREDICTED RISK TIER</span>
                    <RiskBadge risk={predictionResult.risk_level} />
                  </div>

                  <div className="pred-prob-row">
                    <span className="pred-prob-number">
                      {Math.round(predictionResult.churn_probability * 100)}%
                    </span>
                    <span className="pred-prob-text">Churn Probability</span>
                  </div>

                  <div className="prob-meter lg">
                    <div
                      className={`prob-fill ${(predictionResult.risk_level || 'low').toLowerCase()}`}
                      style={{ width: `${Math.round(predictionResult.churn_probability * 100)}%` }}
                    />
                  </div>

                  <div className="pred-meta-info">
                    <div className="meta-line">
                      <span>Model Used:</span>
                      <strong>{predictionResult.model_name}</strong>
                    </div>
                    <div className="meta-line">
                      <span>Timestamp:</span>
                      <strong>{formatTime(predictionResult.prediction_date)}</strong>
                    </div>
                    {predictionResult.customer_id && (
                      <div className="meta-line">
                        <span>Database Status:</span>
                        <strong className="text-success">Saved to predictions table</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pred-interpretation">
                  <h4>Diagnostic Insights:</h4>
                  <ul>
                    {predictionResult.churn_probability > 0.60 ? (
                      <>
                        <li className="text-danger font-semibold">
                          ⚠️ High Churn Risk: Customer exhibits significant dissatisfaction, high complaint frequencies, or payment delinquency.
                        </li>
                        <li>Recommended Action: Immediate outreach by customer success team with loyalty discounts or service resolution.</li>
                      </>
                    ) : predictionResult.churn_probability >= 0.30 ? (
                      <>
                        <li className="text-warning font-semibold">
                          ⚡ Medium Churn Risk: Moderate engagement with occasional friction in support or payments.
                        </li>
                        <li>Recommended Action: Monitor activity closely and trigger proactive check-in email.</li>
                      </>
                    ) : (
                      <>
                        <li className="text-success font-semibold">
                          ✅ Low Churn Risk: Healthy product engagement, high satisfaction score, and reliable payments.
                        </li>
                        <li>Recommended Action: Standard retention flow; candidate for potential plan upgrade.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="prediction-placeholder">
                <BrainCircuit size={48} className="text-primary mb-3" />
                <h3>No Prediction Generated Yet</h3>
                <p>
                  Select a customer or customize behavioral parameters on the left, then click{' '}
                  <strong>&quot;Calculate Churn Probability&quot;</strong> to run real-time inference.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
