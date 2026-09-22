import { RefreshCw, AlertCircle, Database, CheckCircle } from 'lucide-react';

// Reusable KPI Stat Card
export function StatCard({ icon: Icon, iconColor = '#6366f1', label, value, sub, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon-wrap" style={{ background: `${iconColor}18`, color: iconColor }}>
          <Icon size={20} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {(sub || trend) && (
        <div className="stat-footer">
          {trend && <span className="stat-trend">{trend}</span>}
          {sub && <span className="stat-sub">{sub}</span>}
        </div>
      )}
    </div>
  );
}

// Section Card Wrapper
export function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-content">{children}</div>
    </div>
  );
}

// Risk Level Badge
export function RiskBadge({ risk }) {
  const normalized = (risk || 'Low').toLowerCase();
  const cls =
    normalized === 'high'
      ? 'risk-high'
      : normalized === 'medium'
      ? 'risk-medium'
      : 'risk-low';

  return <span className={`risk-badge ${cls}`}>{risk || 'Low'}</span>;
}

// Churn Status Badge
export function ChurnBadge({ churn }) {
  const isChurn = churn === 1 || churn === '1' || churn === true;
  return (
    <span className={`churn-badge ${isChurn ? 'badge-churned' : 'badge-retained'}`}>
      {isChurn ? 'Churned' : 'Active'}
    </span>
  );
}

// Plan Badge
export function PlanBadge({ plan }) {
  const p = (plan || 'Standard').toLowerCase();
  return <span className={`plan-badge plan-${p}`}>{plan || 'Standard'}</span>;
}

// Loading Skeleton
export function SkeletonLoader({ rows = 4, height = 28 }) {
  return (
    <div className="skeleton-wrap">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-bar"
          style={{ height: `${height}px`, opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}

// Error State Banner
export function ErrorState({ message = 'Unable to connect to FastAPI backend.', onRetry }) {
  return (
    <div className="error-state-card">
      <AlertCircle size={36} className="error-icon" />
      <h3>Backend Connection Unavailable</h3>
      <p>{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry}>
            <RefreshCw size={15} /> Retry Connection
          </button>
        )}
      </div>
    </div>
  );
}

// Empty State
export function EmptyState({ message = 'No data available', subtext }) {
  return (
    <div className="empty-state">
      <Database size={32} className="empty-icon" />
      <p className="empty-text">{message}</p>
      {subtext && <p className="empty-sub">{subtext}</p>}
    </div>
  );
}

// Formatters
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
}

export function formatPercent(value) {
  return `${(value || 0).toFixed(1)}%`;
}

export function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
