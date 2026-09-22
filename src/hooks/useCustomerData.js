import { useState, useEffect, useCallback } from 'react';
import { getAnalyticsOverview, getCustomers, checkBackendHealth } from '../services/api';

export function useCustomerData(pollIntervalMs = 5000) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [dbStatus, setDbStatus] = useState({ connected: false });

  const refresh = useCallback(async () => {
    try {
      const [health, ov, custs] = await Promise.all([
        checkBackendHealth(),
        getAnalyticsOverview(),
        getCustomers({ limit: 100 }),
      ]);
      setDbStatus(health);
      setOverview(ov);
      setCustomers(custs);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (pollIntervalMs > 0) {
      const timer = setInterval(refresh, pollIntervalMs);
      return () => clearInterval(timer);
    }
  }, [refresh, pollIntervalMs]);

  return { loading, error, overview, customers, dbStatus, refresh };
}
