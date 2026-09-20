import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts';
import { Users, TrendingUp, Clock, Award, TrendingDown } from 'lucide-react';
import { PageHeader, Card, StatCard } from '../components/shared';
import { computeAnalytics } from '../data/mockStudents';

const BRANCH_COLORS = ['#2563eb', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b'];

export default function AnalyticsPage({ students, lastRefresh, onRefresh, isSyncing }) {
  const {
    total, avgMarks, avgAttendance, highestMarks, lowestMarks,
    branchStats, marksDistribution, attendanceDistribution,
  } = computeAnalytics(students);

  return (
    <div className="page">
      <PageHeader
        title="Analytics"
        subtitle="Statistical overview of student performance and distribution."
        lastRefresh={lastRefresh}
        onRefresh={onRefresh}
        isSyncing={isSyncing}
      />

      {/* KPI cards */}
      <div className="stat-grid">
        <StatCard icon={Users}       iconColor="#2563eb" label="Total Students"     value={total} />
        <StatCard icon={TrendingUp}  iconColor="#10b981" label="Average Marks"      value={avgMarks} sub="out of 100" />
        <StatCard icon={Clock}       iconColor="#f59e0b" label="Avg Attendance"     value={`${avgAttendance}%`} />
        <StatCard icon={Award}       iconColor="#6366f1" label="Highest Marks"      value={highestMarks} />
        <StatCard icon={TrendingDown} iconColor="#ef4444" label="Lowest Marks"      value={lowestMarks} />
      </div>

      {/* Branch-wise charts */}
      <div className="chart-grid-2">
        <Card title="Branch-wise Student Count">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={branchStats} margin={{ top: 4, right: 16, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Students" radius={[4,4,0,0]}>
                {branchStats.map((_, i) => <Cell key={i} fill={BRANCH_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Branch-wise Average Marks">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={branchStats} margin={{ top: 4, right: 16, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="avgMarks" name="Avg Marks" radius={[4,4,0,0]}>
                {branchStats.map((_, i) => <Cell key={i} fill={BRANCH_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Distribution charts */}
      <div className="chart-grid-2">
        <Card title="Marks Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={marksDistribution} margin={{ top: 4, right: 16, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Students" fill="#2563eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Attendance Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceDistribution} margin={{ top: 4, right: 16, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Students" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Branch summary table */}
      <Card title="Branch-wise Summary">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Total Students</th>
                <th>Average Marks</th>
                <th>Average Attendance</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {branchStats.map((b, i) => (
                <tr key={b.branch}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: BRANCH_COLORS[i], display: 'inline-block',
                        }}
                      />
                      {b.branch}
                    </span>
                  </td>
                  <td>{b.count}</td>
                  <td>
                    <span className={`marks-cell ${b.avgMarks >= 80 ? 'marks-high' : b.avgMarks >= 60 ? 'marks-mid' : 'marks-low'}`}>
                      {b.avgMarks}
                    </span>
                  </td>
                  <td>{b.avgAttendance}%</td>
                  <td>
                    <div className="progress-bar-wrap">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${total ? (b.count / total * 100).toFixed(0) : 0}%` }}
                      />
                      <span className="progress-label">{total ? (b.count / total * 100).toFixed(0) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
