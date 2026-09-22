import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/Toast';

// Pages
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import ChurnPredictionPage from './pages/ChurnPredictionPage';
import HighRiskPage from './pages/HighRiskPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import PaymentsPage from './pages/PaymentsPage';
import ComplaintsPage from './pages/ComplaintsPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import PredictionHistoryPage from './pages/PredictionHistoryPage';
import DatabaseActivityPage from './pages/DatabaseActivityPage';
import AboutPage from './pages/AboutPage';

import { checkBackendHealth } from './services/api';
import './App.css';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dbStatus, setDbStatus] = useState({ connected: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // 30s default
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [syncTrigger, setSyncTrigger] = useState(0);

  // Health check & global sync coordinator
  const syncWithDatabase = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const health = await checkBackendHealth();
      setDbStatus(health);
      setLastSyncTime(new Date());
      setSyncTrigger((prev) => prev + 1);
    } catch {
      setDbStatus({ connected: false });
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    syncWithDatabase(false);
  }, [syncWithDatabase]);

  // Configurable Auto-Sync Timer (Default 30s)
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      syncWithDatabase(true);
    }, autoRefreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, syncWithDatabase]);

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((prev) => !prev)}
          />

          <div className="main-wrapper">
            <Navbar
              dbStatus={dbStatus}
              isSyncing={isSyncing}
              onRefresh={() => syncWithDatabase(false)}
              autoRefreshInterval={autoRefreshInterval}
              onIntervalChange={setAutoRefreshInterval}
              lastSyncTime={lastSyncTime}
            />

            <main className="main-content">
              <Routes>
                <Route path="/" element={<DashboardPage key={syncTrigger} />} />
                <Route path="/customers" element={<CustomersPage key={syncTrigger} />} />
                <Route path="/customers/:id" element={<CustomerProfilePage key={syncTrigger} />} />
                <Route path="/prediction" element={<ChurnPredictionPage key={syncTrigger} />} />
                <Route path="/high-risk" element={<HighRiskPage key={syncTrigger} />} />
                <Route path="/analytics" element={<AnalyticsPage key={syncTrigger} />} />
                <Route path="/subscriptions" element={<SubscriptionsPage key={syncTrigger} />} />
                <Route path="/payments" element={<PaymentsPage key={syncTrigger} />} />
                <Route path="/complaints" element={<ComplaintsPage key={syncTrigger} />} />
                <Route path="/model-performance" element={<ModelPerformancePage key={syncTrigger} />} />
                <Route path="/prediction-history" element={<PredictionHistoryPage key={syncTrigger} />} />
                <Route path="/database-activity" element={<DatabaseActivityPage key={syncTrigger} />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<DashboardPage key={syncTrigger} />} />
              </Routes>
            </main>
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
