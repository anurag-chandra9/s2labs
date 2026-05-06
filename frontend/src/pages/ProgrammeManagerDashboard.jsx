import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import Navbar from '../components/Navbar'
import api from '../lib/api'

export default function ProgrammeManagerDashboard() {
  const { user } = useUser()
  const [summary, setSummary] = useState(null)
  const [selectedInstitution, setSelectedInstitution] = useState(null)
  const [instSummary, setInstSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/programme/summary')
      .then(r => setSummary(r.data))
      .finally(() => setLoading(false))
  }, [])

  const viewInstitution = async (inst) => {
    setSelectedInstitution(inst)
    setInstSummary(null)
    try {
      const { data } = await api.get(`/institutions/${inst.institutionId}/summary`)
      setInstSummary(data)
    } catch (err) {
      alert('Failed to load institution summary')
    }
  }

  const totalStudents = summary?.summary.reduce((s, i) => s + i.totalStudents, 0) || 0
  const totalSessions = summary?.summary.reduce((s, i) => s + i.totalSessions, 0) || 0
  const avgRate = summary?.summary.length
    ? Math.round(summary.summary.reduce((s, i) => s + i.attendanceRate, 0) / summary.summary.length)
    : 0

  return (
    <div className="dashboard">
      <Navbar title="Programme Manager Dashboard" />
      <div className="content">
        <h2>Welcome, {user?.firstName}</h2>

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
              <div className="stat-card">
                <div className="stat-number">{avgRate}%</div>
                <div className="stat-label">Avg Attendance</div>
              </div>
            </div>

            <div className="two-col">
              <div className="card">
                <h3>Institutions Overview</h3>
                {summary?.summary.length === 0 ? (
                  <p className="empty-state">No data yet.</p>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Institution</th><th>Batches</th><th>Students</th><th>Sessions</th><th>Attendance</th><th>Action</th></tr></thead>
                      <tbody>
                        {summary?.summary.map(inst => (
                          <tr key={inst.institutionId} className={selectedInstitution?.institutionId === inst.institutionId ? 'row-selected' : ''}>
                            <td>{inst.institutionName}</td>
                            <td>{inst.totalBatches}</td>
                            <td>{inst.totalStudents}</td>
                            <td>{inst.totalSessions}</td>
                            <td>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${inst.attendanceRate}%`, background: inst.attendanceRate >= 75 ? '#22c55e' : inst.attendanceRate >= 50 ? '#f59e0b' : '#ef4444' }} />
                                <span>{inst.attendanceRate}%</span>
                              </div>
                            </td>
                            <td><button className="btn btn-sm btn-primary" onClick={() => viewInstitution(inst)}>Details</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="card">
                <h3>Batch Details {selectedInstitution && `— ${selectedInstitution.institutionName}`}</h3>
                {!selectedInstitution && <p className="empty-state">Select an institution to view batch details.</p>}
                {selectedInstitution && !instSummary && <p>Loading...</p>}
                {instSummary && (
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Batch</th><th>Students</th><th>Sessions</th><th>Attendance</th></tr></thead>
                      <tbody>
                        {instSummary.batchSummaries.map(b => (
                          <tr key={b.batchId}>
                            <td>{b.batchName}</td>
                            <td>{b.totalStudents}</td>
                            <td>{b.totalSessions}</td>
                            <td>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${b.attendanceRate}%`, background: b.attendanceRate >= 75 ? '#22c55e' : b.attendanceRate >= 50 ? '#f59e0b' : '#ef4444' }} />
                                <span>{b.attendanceRate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
