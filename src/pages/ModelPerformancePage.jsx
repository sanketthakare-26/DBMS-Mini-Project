import { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  BarChart3,
  Award,
  Layers,
  Calendar,
  Database,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { getModelInfo, getFeatureImportance } from '../services/api';
import {
  StatCard,
  Card,
  SkeletonLoader,
  ErrorState,
  formatPercent,
  formatTime,
} from '../components/shared';

export default function ModelPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [featureImportance, setFeatureImportance] = useState([]);

  const loadModelData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [info, fi] = await Promise.all([
        getModelInfo(),
        getFeatureImportance(),
      ]);
      setModelInfo(info);
      setFeatureImportance(fi.slice(0, 10)); // Top 10 features
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModelData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-heading">Machine Learning Model Performance</h1>
        <p className="page-lead">Loading Scikit-learn model evaluation metrics and feature importances...</p>
        <SkeletonLoader rows={8} height={35} />
      </div>
    );
  }

  if (error || !modelInfo) {
    return (
      <div className="page-container">
        <ErrorState message={error || 'Model metrics unavailable'} onRetry={loadModelData} />
      </div>
    );
  }

  const fiChartData = [...featureImportance].reverse().map((f) => ({
    name: f.feature.replace(/_/g, ' '),
    importance: Math.round(f.importance * 1000) / 10, // converted to %
    raw: f.importance,
  }));

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">Model Performance</h1>
          <p className="page-lead">
            Validation metrics, algorithm benchmarks, and feature importance
          </p>
        </div>
      </div>

      {/* Model Overview Banner */}
      <div className="model-hero-banner">
        <div className="model-hero-left">
          <div className="model-badge">Active Production Model</div>
          <h2 className="model-title">{modelInfo.model_name}</h2>
          <p className="model-sub">
            Algorithm: <code>{modelInfo.model_type}</code> • Trained on {formatTime(modelInfo.training_date)}
          </p>
          <div className="model-stats-row">
            <span>
              <Database size={14} /> Training Samples: <strong>{modelInfo.training_samples}</strong>
            </span>
            <span>
              <Layers size={14} /> Holdout Test: <strong>{modelInfo.test_samples}</strong>
            </span>
            <span>
              <BarChart3 size={14} /> 5-Fold Stratified CV
            </span>
          </div>
        </div>

        <div className="model-hero-right">
          <div className="roc-circle">
            <span className="roc-val">{formatPercent((modelInfo.roc_auc || 0) * 100)}</span>
            <span className="roc-lbl">ROC-AUC Score</span>
          </div>
        </div>
      </div>

      {/* 5 Core Metric Stat Cards */}
      <div className="grid-cards-5">
        <StatCard
          icon={Award}
          iconColor="#6366f1"
          label="ROC-AUC Score"
          value={modelInfo.roc_auc?.toFixed(4)}
          sub="Separation capability"
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="#10b981"
          label="Test Accuracy"
          value={formatPercent((modelInfo.accuracy || 0) * 100)}
          sub="Overall correctness"
        />
        <StatCard
          icon={TrendingUp}
          iconColor="#3b82f6"
          label="Precision"
          value={formatPercent((modelInfo.precision || 0) * 100)}
          sub="Low false positive rate"
        />
        <StatCard
          icon={BarChart3}
          iconColor="#f59e0b"
          label="Recall (Sensitivity)"
          value={formatPercent((modelInfo.recall || 0) * 100)}
          sub="Churn capture efficiency"
        />
        <StatCard
          icon={Cpu}
          iconColor="#8b5cf6"
          label="F1-Score"
          value={modelInfo.f1?.toFixed(4)}
          sub="Harmonic balance"
        />
      </div>

      {/* Benchmark Comparison Table */}
      <Card
        title="4-Algorithm Benchmark Comparison"
        subtitle="Empirical test results evaluated across candidate classification models"
      >
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate Model</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1 Score</th>
                <th>Test ROC-AUC</th>
                <th>5-Fold CV ROC-AUC</th>
                <th>Selection Status</th>
              </tr>
            </thead>
            <tbody>
              {(modelInfo.model_comparison || []).map((m, idx) => {
                const isWinner = m.model_name === modelInfo.model_name;
                return (
                  <tr key={idx} className={isWinner ? 'row-winner' : ''}>
                    <td>
                      <div className="flex items-center gap-2">
                        {isWinner && <Award size={16} className="text-warning" />}
                        <strong>{m.model_name}</strong>
                      </div>
                    </td>
                    <td>{formatPercent((m.accuracy || 0) * 100)}</td>
                    <td>{formatPercent((m.precision || 0) * 100)}</td>
                    <td>{formatPercent((m.recall || 0) * 100)}</td>
                    <td>{m.f1?.toFixed(4)}</td>
                    <td className="font-bold">{m.roc_auc?.toFixed(4)}</td>
                    <td>{m.cv_roc_auc?.toFixed(4)}</td>
                    <td>
                      {isWinner ? (
                        <span className="badge badge-excellent">Selected Champion</span>
                      ) : (
                        <span className="badge badge-average">Benchmark Candidate</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Feature Importance Bar Chart */}
      <Card
        title="Top 10 Feature Importances (Model Explainability)"
        subtitle="Ranked predictive weight contributions extracted from the trained pipeline"
      >
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={fiChartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 140, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" unit="%" />
              <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 13 }} />
              <Tooltip formatter={(val) => [`${val}% weight`, 'Relative Importance']} />
              <Bar dataKey="importance" fill="#6366f1" radius={[0, 4, 4, 0]}>
                {fiChartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === fiChartData.length - 1 ? '#4f46e5' : '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
