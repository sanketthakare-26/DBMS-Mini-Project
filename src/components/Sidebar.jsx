import { LayoutDashboard, Users, BarChart2, DatabaseZap, Info, ChevronLeft, ChevronRight } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'students',   label: 'Students',            icon: Users },
  { id: 'analytics',  label: 'Analytics',           icon: BarChart2 },
  { id: 'db-changes', label: 'Database Changes',    icon: DatabaseZap },
  { id: 'about',      label: 'About Project',       icon: Info },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, onToggle }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        {isOpen && (
          <div className="brand-text">
            <span className="brand-name">StudentDB</span>
            <span className="brand-sub">Analytics</span>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle} title="Toggle sidebar">
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${currentPage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
            title={!isOpen ? label : undefined}
          >
            <Icon size={20} className="nav-icon" />
            {isOpen && <span className="nav-label">{label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="sidebar-footer">
          <span>DBMS Mini Project</span>
        </div>
      )}
    </aside>
  );
}
