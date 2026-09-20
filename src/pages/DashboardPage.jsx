import { Users, TrendingUp, Clock, Award } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { StatCard, PageHeader, Card, StatusBadge } from '../components/shared';
import { computeAnalytics } from '../data/mockStudents';

const BRANCH_COLORS = ['#2563eb', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b'];

export default function DashboardPage({ students, lastRefresh, onRefresh, isSyncing }) {
  const analytics = computeAnalytics(students);
  const { total, avgMarks, avgAttendance, highestMarks,
    branchStats, marksDistribution, attendanceDistribution } = analytics;

  return (
    <div className="page">
      <PageHeader
        title="Student Database Dashboard"
        subtitle="Monitor and visualize student information stored in the database."
        lastRefresh={lastRefresh}
        onRefresh={onRefresh}
        isSyncing={isSyncing}
      />

      {/* Summary cards */}
      <div className="stat-grid">
        <StatCard icon={Users}     iconColor="#2563eb" label="Total Students"    value={total} />
        <StatCard icon={TrendingUp} iconColor="#10b981" label="Average Marks"    value={avgMarks} sub="out of 100" />
        <StatCard icon={Clock}     iconColor="#f59e0b" label="Average Attendance" value={`${avgAttendance}%`} />
        <StatCard icon={Award}     iconColor="#6366f1" label="Highest Marks"     value={highestMarks} />
      </div>

      {/* Charts row 1 */}
      <div className="chart-grid-2">
        <Card title="Students by Branch">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={branchStats} margin={{ top: 4, right: 16, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                {branchStats.map((_, i) => <Cell key={i} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Average Marks by Branch">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={branchStats} margin={{ top: 4, right: 16, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="avgMarks" name="Avg Marks" radius={[4, 4, 0, 0]}>
                {branchStats.map((_, i) => <Cell key={i} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="chart-grid-2">
        <Card title="Marks Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={marksDistribution} margin={{ top: 4, right: 16, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Students" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Attendance Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attendanceDistribution} margin={{ top: 4, right: 16, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Students" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Student table */}
      <Card title={`Student Records (${students.length})`}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Branch</th>
                <th>Semester</th>
                <th>Marks</th>
                <th>Attendance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td className="td-id">#{s.id}</td>
                  <td className="td-name">{s.name}</td>
                  <td><span className="branch-tag">{s.branch}</span></td>
                  <td>{s.semester}</td>
                  <td>
                    <span className={`marks-cell ${s.marks >= 85 ? 'marks-high' : s.marks >= 60 ? 'marks-mid' : 'marks-low'}`}>
                      {s.marks}
                    </span>
                  </td>
                  <td>{s.attendance}%</td>
                  <td><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
