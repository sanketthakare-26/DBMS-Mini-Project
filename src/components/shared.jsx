// Reusable stat card
export function StatCard({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrap" style={{ background: iconColor + '18', color: iconColor }}>
        <Icon size={22} />
      </div>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

// Page header with optional refresh button and live-sync indicator
export function PageHeader({ title, subtitle, lastRefresh, onRefresh, refreshLabel = 'Refresh Data', isSyncing }) {
  return (
    <div className="page-header">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 className="page-title">{title}</h1>
          {/* Live indicator — pulsing green dot shows auto-sync is active */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '12px', fontWeight: 600, color: '#10b981',
            background: '#ecfdf5', border: '1px solid #6ee7b7',
            borderRadius: '999px', padding: '2px 10px',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#10b981',
              animation: 'livePulse 1.5s ease-in-out infinite',
              display: 'inline-block',
            }} />
            Live
          </span>
        </div>
        <p className="page-subtitle">{subtitle}</p>
        {lastRefresh && (
          <p className="last-updated">
            {isSyncing ? '🔄 Syncing with database…' : `Last synced: ${formatTime(lastRefresh)}`}
          </p>
        )}
      </div>
      {onRefresh && (
        <button className="btn btn-primary" onClick={onRefresh} disabled={isSyncing}>
          <span>⟳</span> {isSyncing ? 'Syncing…' : refreshLabel}
        </button>
      )}
    </div>
  );
}

// Section card wrapper
export function Card({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </div>
  );
}

// Status badge
export function StatusBadge({ status }) {
  const cls = {
    'Excellent':       'badge-excellent',
    'Good':            'badge-good',
    'Average':         'badge-average',
    'Needs Attention': 'badge-attention',
  }[status] ?? 'badge-average';

  return <span className={`badge ${cls}`}>{status}</span>;
}

// Format a Date object as readable string
export function formatTime(date) {
  if (!date) return '';
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// Relative time (e.g. "5 minutes ago")
export function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)           return `${diff} seconds ago`;
  if (diff < 3600)         return `${Math.floor(diff / 60)} minute${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`;
  if (diff < 86400)        return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
}
