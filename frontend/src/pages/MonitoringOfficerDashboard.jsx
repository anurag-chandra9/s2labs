import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import Navbar from '../components/Navbar'
import api from '../lib/api'

export default function MonitoringOfficerDashboard() {
  const { user } = useUser()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/programme/summary')
      .then(r => setSummary(r.data))
      .finally(() => setLoading(false))
  }, [])

  const totalStudents = summary?.summary.reduce((s, i) => s + i.totalStudents, 0) || 0
  const totalSessions = summary?.summary.reduce((s, i) => s + i.totalSessions, 0) || 0
  const avgRate = summary?.summary.length
    ? Math.round(summary.summary.reduce((s, i) => s + i.attendanceRate, 0) / summary.summary.length)
    : 0

  return (
    <div className="dashboard">
      <Navbar title="Monitoring Officer Dashboard" />
      <div className="content">
        <h2>Welcome, {user?.firstName}</h2>
        <p className="read-only-notice">🔒 Read-only access — you can view all data but cannot make changes.</p>

        {loading ? <p>Loading...</p> : (
          <>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-number">{summary?.totalInstitutions || 0}</div>
                <div className="stat-label">Institutions</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{totalStudents}</div>
                <div className="stat-label">Total Students</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{totalSessions}</div>
                <div className="stat-label">Total Sessions</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-number">{avgRate}%</div>
                <div className="stat-label">Programme Attendance Rate</div>
              </div>
            </div>

            <div className="card">
              <h3>Programme-Wide Attendance</h3>
              {summary?.summary.length === 0 ? (
                <p className="empty-state">No data available yet.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Institution</th>
                        <th>Batches</th>
                        <th>Students</th>
                        <th>Sessions</th>
                        <th>Attendance Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary?.summary.map(inst => (
                        <tr key={inst.institutionId}>
                          <td>{inst.institutionName}</td>
                          <td>{inst.totalBatches}</td>
                          <td>{inst.totalStudents}</td>
                          <td>{inst.totalSessions}</td>
                          <td>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${inst.attendanceRate}%`,
                                  background: inst.attendanceRate >= 75 ? '#22c55e' : inst.attendanceRate >= 50 ? '#f59e0b' : '#ef4444'
                                }}
                              />
                              <span>{inst.attendanceRate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
