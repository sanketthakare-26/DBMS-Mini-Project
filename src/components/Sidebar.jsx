import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  AlertOctagon,
  BarChart3,
  CreditCard,
  Receipt,
  MessageSquareWarning,
  Cpu,
  History,
  DatabaseZap,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/',                   label: 'Dashboard',             icon: LayoutDashboard },
  { path: '/customers',          label: 'Customers',             icon: Users },
  { path: '/prediction',         label: 'Churn Prediction',      icon: BrainCircuit },
  { path: '/high-risk',          label: 'High Risk Customers',   icon: AlertOctagon },
  { path: '/analytics',          label: 'Analytics',             icon: BarChart3 },
  { path: '/subscriptions',      label: 'Subscriptions',         icon: CreditCard },
  { path: '/payments',           label: 'Payments',              icon: Receipt },
  { path: '/complaints',         label: 'Complaints',            icon: MessageSquareWarning },
  { path: '/model-performance',  label: 'Model Performance',     icon: Cpu },
  { path: '/prediction-history',  label: 'Prediction History',    icon: History },
  { path: '/database-activity',  label: 'Database Activity',     icon: DatabaseZap },
  { path: '/about',              label: 'About Project',         icon: Info },
];

export default function Sidebar({ isOpen, onToggle }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-brand">
        <div className="brand-logo-wrap">
          <ShieldAlert size={22} className="brand-icon" />
          {isOpen && (
            <div className="brand-text">
              <span className="brand-name">RetentionHub</span>
              <span className="brand-sub">Customer Intelligence</span>
            </div>
          )}
        </div>
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            title={!isOpen ? label : undefined}
          >
            <Icon size={18} className="nav-icon" />
            {isOpen && <span className="nav-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {isOpen && (
        <div className="sidebar-footer">
          <div className="footer-tag">System Connected</div>
          <div className="footer-meta">FastAPI & MySQL 8.0</div>
        </div>
      )}
    </aside>

  );
}
