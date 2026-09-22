import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { History, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPredictions } from '../services/api';
import {
  Card,
  RiskBadge,
  SkeletonLoader,
  ErrorState,
  EmptyState,
  formatPercent,
  formatTime,
} from '../components/shared';

export default function PredictionHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortBy, setSortBy] = useState('prediction_date');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const loadPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPredictions({ limit: 1000 });
      setPredictions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  const filtered = useMemo(() => {
    return predictions.filter((p) => {
      const matchSearch =
        !search ||
        p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.customer_code?.toLowerCase().includes(search.toLowerCase());

      const matchRisk = riskFilter === 'All' || p.risk_level === riskFilter;
      return matchSearch && matchRisk;
    }).sort((a, b) => {
      if (sortBy === 'prediction_date') {
        return new Date(b.prediction_date) - new Date(a.prediction_date);
      }
      if (sortBy === 'churn_probability') {
        return b.churn_probability - a.churn_probability;
      }
      return b.prediction_id - a.prediction_id;
    });
  }, [predictions, search, riskFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">Prediction History</h1>
          <p className="page-lead">
            Chronological record of churn predictions stored in MySQL
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadPredictions} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadPredictions} />
      ) : (
        <Card>
          <div className="filter-bar">
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search predictions by customer name or code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="All">All Risk Tiers</option>
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="prediction_date">Sort: Latest First</option>
                <option value="churn_probability">Sort: Highest Probability</option>
                <option value="prediction_id">Sort: Prediction ID</option>
              </select>
            </div>
          </div>

          <div className="results-summary">
            Showing <strong>{filtered.length}</strong> logged predictions
          </div>

          {loading ? (
            <SkeletonLoader rows={8} height={35} />
          ) : filtered.length === 0 ? (
            <EmptyState message="No prediction history found" />
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Churn Probability</th>
                      <th>Assigned Risk</th>
                      <th>Inference Model</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((p) => (
                      <tr key={p.prediction_id}>
                        <td>#{p.prediction_id}</td>
                        <td>
                          <div className="customer-cell">
                            <Link to={`/customers/${p.customer_id}`} className="customer-name-link">
                              {p.customer_name}
                            </Link>
                            <span className="customer-code">{p.customer_code}</span>
                          </div>
                        </td>
                        <td>
                          <div className="prob-meter">
                            <div
                              className={`prob-fill ${(p.risk_level || '').toLowerCase()}`}
                              style={{ width: `${Math.round((p.churn_probability || 0) * 100)}%` }}
                            />
                            <span className="font-semibold">
                              {formatPercent((p.churn_probability || 0) * 100)}
                            </span>
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

              {/* Pagination */}
              <div className="pagination-bar">
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="pagination-buttons">
                  <button
                    className="btn btn-secondary btn-xs"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-xs"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
