import { useState } from 'react';
import { RefreshCw, Play, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { runAllPredictions } from '../services/api';
import { useToast } from './Toast';

export default function Navbar({
  dbStatus,
  isSyncing,
  onRefresh,
  autoRefreshInterval,
  onIntervalChange,
  lastSyncTime,
}) {
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const { addToast } = useToast();

  const handleRunBatch = async () => {
    setIsRunningBatch(true);
    try {
      const result = await runAllPredictions();
      addToast(
        `Batch ML completed! Processed: ${result.total_processed} customers (High Risk: ${result.high_risk}, Med: ${result.medium_risk}, Low: ${result.low_risk})`,
        'success',
        6000
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      addToast(`Batch prediction failed: ${err.message}`, 'error', 6000);
    } finally {
      setIsRunningBatch(false);
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <h2 className="navbar-system-title">
          Customer Retention & Churn Analytics
        </h2>
      </div>

      <div className="navbar-right">
        {/* Live MySQL status */}
        <div className={`db-status-pill ${dbStatus?.connected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot" />
          <Database size={13} style={{ marginRight: 4 }} />
          <span>
            {dbStatus?.connected
              ? `${dbStatus.database || 'churn_prediction'} (MySQL 8.0)`
              : 'MySQL Offline'}
          </span>
        </div>

        {/* Auto Refresh dropdown */}
        <div className="auto-refresh-control">
          <label htmlFor="refresh-select">Auto-Sync:</label>
          <select
            id="refresh-select"
            value={autoRefreshInterval}
            onChange={(e) => onIntervalChange(Number(e.target.value))}
            className="select-sm"
          >
            <option value={0}>Off</option>
            <option value={15}>15s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
          </select>
        </div>

        {/* Manual Refresh button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={isSyncing}
          title="Refresh data from MySQL"
        >
          <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
          <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* Run Batch ML button */}
        <button
          className="btn btn-primary btn-sm btn-batch"
          onClick={handleRunBatch}
          disabled={isRunningBatch || !dbStatus?.connected}
          title="Run prediction model on all customers"
        >
          <Play size={13} className={isRunningBatch ? 'spin' : ''} />
          <span>{isRunningBatch ? 'Running ML...' : 'Run Predictions'}</span>
        </button>
      </div>
    </header>
  );
}

