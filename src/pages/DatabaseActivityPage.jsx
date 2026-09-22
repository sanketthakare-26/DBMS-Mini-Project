import { useState, useEffect } from 'react';
import { DatabaseZap, RefreshCw, PlusCircle, Edit3, Trash2, ShieldAlert } from 'lucide-react';
import { getActivity } from '../services/api';
import {
  Card,
  SkeletonLoader,
  ErrorState,
  EmptyState,
  formatTime,
} from '../components/shared';

export default function DatabaseActivityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('All');

  const loadActivityLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivity(100);
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivityLogs();
  }, []);

  const filteredLogs = logs.filter(
    (item) => actionFilter === 'All' || item.action_type === actionFilter
  );

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act === 'INSERT') {
      return (
        <span className="action-badge badge-insert">
          <PlusCircle size={12} /> INSERT
        </span>
      );
    }
    if (act === 'UPDATE') {
      return (
        <span className="action-badge badge-update">
          <Edit3 size={12} /> UPDATE
        </span>
      );
    }
    if (act === 'DELETE') {
      return (
        <span className="action-badge badge-delete">
          <Trash2 size={12} /> DELETE
        </span>
      );
    }
    return <span className="action-badge">{act}</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">Database Activity</h1>
          <p className="page-lead">
            Live audit trail logged automatically by MySQL database triggers
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadActivityLogs} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadActivityLogs} />
      ) : (
        <Card title="Activity Stream" subtitle="Records from activity_logs table">
          <div className="filter-bar">
            <div className="filter-group">
              <label>Filter by Trigger Action:</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Actions</option>
                <option value="INSERT">INSERT Triggers</option>
                <option value="UPDATE">UPDATE Triggers</option>
                <option value="DELETE">DELETE Triggers</option>
              </select>
            </div>
            <div className="results-summary">
              Showing <strong>{filteredLogs.length}</strong> logged database events
            </div>
          </div>

          {loading ? (
            <SkeletonLoader rows={8} height={40} />
          ) : filteredLogs.length === 0 ? (
            <EmptyState message="No activity log entries found" />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Action</th>
                    <th>Target Table</th>
                    <th>Record ID</th>
                    <th>Event Audit Description</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.activity_id}>
                      <td>#{log.activity_id}</td>
                      <td>{getActionBadge(log.action_type)}</td>
                      <td>
                        <span className="table-name-pill">{log.table_name}</span>
                      </td>
                      <td>{log.record_id ? `#${log.record_id}` : '—'}</td>
                      <td>
                        <span className="log-description-text">{log.description}</span>
                      </td>
                      <td>{formatTime(log.created_at || log.timestamp)}</td>
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
