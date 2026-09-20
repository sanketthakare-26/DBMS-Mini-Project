import { PageHeader, Card } from '../components/shared';
import { Database, Code2, Server, Monitor, BarChart2 } from 'lucide-react';

const TECHNOLOGIES = [
  { name: 'MySQL',             icon: Database, desc: 'Relational database for persistent student data storage' },
  { name: 'Python',            icon: Code2,    desc: 'Backend language used to connect MySQL and expose REST APIs' },
  { name: 'MySQL Connector',   icon: Database, desc: 'Python library that interfaces with the MySQL database' },
  { name: 'React',             icon: Monitor,  desc: 'Frontend UI library for building interactive components' },
  { name: 'Vite',              icon: Server,   desc: 'Fast development build tool for the React frontend' },
  { name: 'Recharts',          icon: BarChart2, desc: 'Composable charting library for React-based visualisations' },
];

const ARCH_STEPS = [
  { label: 'MySQL Database',   desc: 'Stores student records in structured relational tables' },
  { label: 'Python Backend',   desc: 'Reads from MySQL and serves data through a REST API' },
  { label: 'REST API',         desc: 'JSON endpoints consumed by the React frontend' },
  { label: 'React Dashboard',  desc: 'Presents data as cards, tables, and interactive charts' },
  { label: 'Charts + Tables',  desc: 'Visual representation of the underlying database state' },
];

export default function AboutPage() {
  return (
    <div className="page">
      <PageHeader
        title="About Project"
        subtitle="Project overview, architecture, technologies, and objectives."
      />

      {/* Project title */}
      <Card>
        <div className="about-hero">
          <h2 className="about-project-title">Student Database Management &amp; Analytics Dashboard</h2>
          <p className="about-tagline">
            A full-stack academic project demonstrating the integration of a relational MySQL database
            with a modern React web dashboard.
          </p>
        </div>
      </Card>

      {/* Objective */}
      <Card title="Project Objective">
        <p className="about-body">
          To demonstrate how a relational database can be connected to a web dashboard and how changes
          in database records — insertions, updates, and deletions — can be visualized in real time
          through interactive charts and tables.
        </p>
        <p className="about-body">
          The project follows a clean <strong>three-tier architecture</strong>: a MySQL database for
          data persistence, a Python backend for business logic and API exposure, and a React frontend
          for interactive visualization.
        </p>
      </Card>

      {/* Technologies */}
      <Card title="Technologies Used">
        <div className="tech-grid">
          {TECHNOLOGIES.map(({ name, icon: Icon, desc }) => (
            <div key={name} className="tech-card">
              <div className="tech-icon-wrap">
                <Icon size={22} />
              </div>
              <div>
                <p className="tech-name">{name}</p>
                <p className="tech-desc">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Architecture */}
      <Card title="Project Architecture">
        <div className="arch-diagram">
          {ARCH_STEPS.map((step, i) => (
            <div key={step.label} className="arch-step-wrap">
              <div className="arch-step">
                <div className="arch-step-num">{i + 1}</div>
                <div>
                  <p className="arch-step-label">{step.label}</p>
                  <p className="arch-step-desc">{step.desc}</p>
                </div>
              </div>
              {i < ARCH_STEPS.length - 1 && <div className="arch-connector">↓</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* Future API */}
      <Card title="Planned API Endpoints">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                { method: 'GET',    path: '/api/students',       desc: 'Retrieve all student records' },
                { method: 'POST',   path: '/api/students',       desc: 'Add a new student' },
                { method: 'PUT',    path: '/api/students/{id}',  desc: 'Update student by ID' },
                { method: 'DELETE', path: '/api/students/{id}',  desc: 'Delete student by ID' },
                { method: 'GET',    path: '/api/analytics',      desc: 'Fetch summary statistics' },
                { method: 'GET',    path: '/api/activity',       desc: 'Fetch recent database changes' },
              ].map(row => (
                <tr key={row.path + row.method}>
                  <td>
                    <span className={`method-badge method-${row.method.toLowerCase()}`}>{row.method}</span>
                  </td>
                  <td><code className="endpoint-code">{row.path}</code></td>
                  <td>{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dev note */}
      <Card>
        <div className="dev-note">
          <p>
            <strong>Current Status:</strong>&nbsp; Connected! The MySQL database (<code>student_dashboard</code>)
            is connected via the Python FastAPI backend running at <code>http://localhost:8000</code>.
            Real-time CRUD operations, views, and change logs are synchronized with MySQL.
          </p>
        </div>
      </Card>
    </div>
  );
}
