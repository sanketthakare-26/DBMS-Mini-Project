import { RefreshCw, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { PageHeader, Card, formatTime, timeAgo } from '../components/shared';

const TYPE_META = {
  added:   { label: 'Added',   color: '#10b981', bg: '#ecfdf5', dot: '●' },
  updated: { label: 'Updated', color: '#2563eb', bg: '#eff6ff', dot: '●' },
  deleted: { label: 'Deleted', color: '#ef4444', bg: '#fef2f2', dot: '●' },
};

const ActivityIcon = ({ type }) => {
  if (type === 'added')   return <PlusCircle size={18} color="#10b981" />;
  if (type === 'updated') return <Edit       size={18} color="#2563eb" />;
  if (type === 'deleted') return <Trash2     size={18} color="#ef4444" />;
  return null;
};

export default function DatabaseChangesPage({ activity, lastRefresh, onRefresh, isSyncing }) {
  return (
    <div className="page">
      <PageHeader
        title="Database Changes"
        subtitle="Track all insert, update, and delete operations performed on the student database."
        lastRefresh={lastRefresh}
        onRefresh={onRefresh}
        refreshLabel="Refresh Database"
        isSyncing={isSyncing}
      />

      {/* Info banner */}
      <div className="info-banner">
        <RefreshCw size={16} />
        <span>
          This page shows real-time database activity.&nbsp;
          <strong>Last Data Refresh:</strong> {formatTime(lastRefresh)}
        </span>
      </div>

      {/* Activity feed */}
      <Card title="Latest Database Activity">
        {activity.length === 0 ? (
          <p className="td-empty">No activity recorded yet.</p>
        ) : (
          <div className="activity-feed">
            {activity.map((item, idx) => {
              const meta = TYPE_META[item.type] ?? TYPE_META.updated;
              return (
                <div key={item.id} className="activity-item">
                  {/* Timeline */}
                  <div className="activity-timeline">
                    <div className="activity-icon-wrap" style={{ background: meta.bg }}>
                      <ActivityIcon type={item.type} />
                    </div>
                    {idx < activity.length - 1 && <div className="activity-line" />}
                  </div>

                  {/* Content */}
                  <div className="activity-content">
                    <div className="activity-header">
                      <span className="activity-title">{item.title}</span>
                      <span className="activity-badge" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="activity-desc">{item.description}</p>
                    <p className="activity-time">{timeAgo(item.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Architecture note */}
      <Card title="How Database Changes Will Work">
        <div className="arch-note">
          <p>
            When the Python backend and MySQL database are connected, clicking{' '}
            <strong>Refresh Database</strong> will:
          </p>
          <ol className="arch-steps">
            <li>Send a <code>GET /api/activity</code> request to the Python backend</li>
            <li>Python queries the MySQL database for recent changes</li>
            <li>The response is returned as JSON to this dashboard</li>
            <li>Charts and tables automatically update to reflect the latest data</li>
          </ol>
          <div className="arch-flow">
            <span className="arch-node">MySQL Database</span>
            <span className="arch-arrow">→</span>
            <span className="arch-node">Python Backend</span>
            <span className="arch-arrow">→</span>
            <span className="arch-node">REST API</span>
            <span className="arch-arrow">→</span>
            <span className="arch-node">React Dashboard</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
