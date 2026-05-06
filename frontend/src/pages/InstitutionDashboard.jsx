import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import Navbar from '../components/Navbar'
import api from '../lib/api'

export default function InstitutionDashboard() {
  const { user } = useUser()
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/batches')
      .then(r => setBatches(r.data))
      .finally(() => setLoading(false))
  }, [])

  const viewSummary = async (batch) => {
    setSelectedBatch(batch)
    setSummary(null)
    try {
      const { data } = await api.get(`/batches/${batch.id}/summary`)
      setSummary(data)
    } catch (err) {
      alert('Failed to load summary')
    }
  }

  return (
    <div className="dashboard">
      <Navbar title="Institution Dashboard" />
      <div className="content">
        <h2>Welcome, {user?.firstName}</h2>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-number">{batches.length}</div>
            <div className="stat-label">Total Batches</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{batches.reduce((s, b) => s + (b._count?.students || 0), 0)}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{batches.reduce((s, b) => s + (b._count?.sessions || 0), 0)}</div>
            <div className="stat-label">Total Sessions</div>
          </div>
        </div>

        <div className="two-col">
          <div className="card">
            <h3>Batches</h3>
            {loading ? <p>Loading...</p> : batches.length === 0 ? (
              <p className="empty-state">No batches found.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Name</th><th>Trainers</th><th>Students</th><th>Sessions</th><th>Action</th></tr></thead>
                  <tbody>
                    {batches.map(b => (
                      <tr key={b.id} className={selectedBatch?.id === b.id ? 'row-selected' : ''}>
                        <td>{b.name}</td>
                        <td>{b.trainers?.map(t => t.name).join(', ') || '—'}</td>
                        <td>{b._count?.students ?? '—'}</td>
                        <td>{b._count?.sessions ?? '—'}</td>
                        <td><button className="btn btn-sm btn-primary" onClick={() => viewSummary(b)}>Summary</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Attendance Summary {selectedBatch && `— ${selectedBatch.name}`}</h3>
            {!selectedBatch && <p className="empty-state">Select a batch to view attendance summary.</p>}
            {selectedBatch && !summary && <p>Loading...</p>}
            {summary && (
              <>
                <p>{summary.totalSessions} sessions total</p>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Student</th><th>Attended</th><th>Total</th><th>Rate</th></tr></thead>
                    <tbody>
                      {summary.summary.map(({ student, attended, totalSessions, percentage }) => (
                        <tr key={student.id}>
                          <td>{student.name}</td>
                          <td>{attended}</td>
                          <td>{totalSessions}</td>
                          <td>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${percentage}%`, background: percentage >= 75 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444' }} />
                              <span>{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
