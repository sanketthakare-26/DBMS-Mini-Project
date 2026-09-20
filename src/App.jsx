import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DatabaseChangesPage from './pages/DatabaseChangesPage';
import AboutPage from './pages/AboutPage';
import { INITIAL_STUDENTS, INITIAL_ACTIVITY, getStatus } from './data/mockStudents';
import {
  getAllStudents,
  addStudent as apiAddStudent,
  updateStudent as apiUpdateStudent,
  deleteStudent as apiDeleteStudent,
  getActivity as apiGetActivity,
} from './services/api';
import './App.css';

// ─── Auto-refresh interval (milliseconds) ─────────────────────────────────
// The dashboard will silently re-read the database every 5 seconds.
// Change this number if you want faster / slower updates.
const POLL_INTERVAL_MS = 5000;

// Normalise a student row coming from the API (student_id → id, add status)
function normaliseStudent(s) {
  return {
    ...s,
    id: s.id ?? s.student_id,
    status: s.status ?? getStatus(Number(s.marks), Number(s.attendance)),
  };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [students, setStudents]       = useState(INITIAL_STUDENTS);
  const [activity, setActivity]       = useState(INITIAL_ACTIVITY);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing]     = useState(false);

  // ── Core fetch function ───────────────────────────────────────────────────
  // silent=true  → background poll (no loading spinner)
  // silent=false → user-triggered refresh (shows spinner)
  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);

    try {
      const studentsData = await getAllStudents();
      if (Array.isArray(studentsData)) {
        setStudents(studentsData.map(normaliseStudent));
      }
    } catch (err) {
      console.warn('Could not load students from backend:', err.message);
    }

    try {
      const activityData = await apiGetActivity();
      if (Array.isArray(activityData)) {
        setActivity(
          activityData.map(item => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        );
      }
    } catch (err) {
      console.warn('Could not load activity log from backend:', err.message);
    }

    setLastRefresh(new Date());
    if (!silent) setIsSyncing(false);
  }, []);

  // ── Load on startup ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // ── AUTO-POLL every POLL_INTERVAL_MS ─────────────────────────────────────
  // This is what makes the dashboard update automatically when you change
  // data directly in MySQL (Workbench, SQL query, etc.) — without clicking
  // any button on the page.
  useEffect(() => {
    const id = setInterval(() => fetchAllData(true), POLL_INTERVAL_MS);
    return () => clearInterval(id); // cleanup on unmount
  }, [fetchAllData]);

  // ── Fallback: push a local activity entry when backend is offline ─────────
  const pushActivity = useCallback((type, title, description) => {
    setActivity(prev => [
      { id: Date.now(), type, title, description, timestamp: new Date() },
      ...prev,
    ]);
  }, []);

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const handleAddStudent = useCallback(async (data) => {
    try {
      await apiAddStudent(data);
      await fetchAllData(false);          // re-read DB immediately after write
    } catch (err) {
      console.error('Failed to add student:', err);
      const newId = Math.max(...students.map(s => s.id), 0) + 1;
      setStudents(prev => [...prev, { id: newId, ...data }]);
      pushActivity('added', 'Student Added', `${data.name} was added`);
    }
  }, [students, pushActivity, fetchAllData]);

  const handleUpdateStudent = useCallback(async (id, data) => {
    try {
      await apiUpdateStudent(id, data);
      await fetchAllData(false);
    } catch (err) {
      console.error('Failed to update student:', err);
      setStudents(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
      pushActivity('updated', 'Student Updated', `Student ID ${id} was updated`);
    }
  }, [pushActivity, fetchAllData]);

  const handleDeleteStudent = useCallback(async (id) => {
    try {
      await apiDeleteStudent(id);
      await fetchAllData(false);
    } catch (err) {
      console.error('Failed to delete student:', err);
      setStudents(prev => prev.filter(s => s.id !== id));
      pushActivity('deleted', 'Student Deleted', `Student ID ${id} was removed`);
    }
  }, [pushActivity, fetchAllData]);

  const handleRefresh = useCallback(() => fetchAllData(false), [fetchAllData]);

  // ── Props shared to every page ────────────────────────────────────────────
  const pageProps = {
    students,
    activity,
    lastRefresh,
    isSyncing,
    onRefresh:  handleRefresh,
    onAdd:      handleAddStudent,
    onUpdate:   handleUpdateStudent,
    onDelete:   handleDeleteStudent,
    pushActivity,
    setLastRefresh,
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':  return <DashboardPage  {...pageProps} />;
      case 'students':   return <StudentsPage    {...pageProps} />;
      case 'analytics':  return <AnalyticsPage   {...pageProps} />;
      case 'db-changes': return <DatabaseChangesPage {...pageProps} />;
      case 'about':      return <AboutPage />;
      default:           return <DashboardPage  {...pageProps} />;
    }
  };

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
