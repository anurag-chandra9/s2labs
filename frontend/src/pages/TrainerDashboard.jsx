import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import Navbar from '../components/Navbar'
import api from '../lib/api'

export default function TrainerDashboard() {
  const { user } = useUser()
  const [sessions, setSessions] = useState([])
  const [batches, setBatches] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sessions')
  const [selectedSession, setSelectedSession] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [inviteResult, setInviteResult] = useState({})

  // Create session form
  const [form, setForm] = useState({ title: '', batchId: '', date: '', startTime: '', endTime: '' })
  const [formMsg, setFormMsg] = useState('')

  // Create batch form
  const [batchForm, setBatchForm] = useState({ name: '', institutionId: '', description: '' })
  const [batchMsg, setBatchMsg] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/sessions/trainer').then(r => setSessions(r.data)),
      api.get('/batches').then(r => setBatches(r.data)),
      api.get('/institutions').then(r => setInstitutions(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const createSession = async (e) => {
    e.preventDefault()
    setFormMsg('')
    try {
      const { data } = await api.post('/sessions', form)
      setSessions(prev => [data, ...prev])
      setForm({ title: '', batchId: '', date: '', startTime: '', endTime: '' })
      setFormMsg('✓ Session created!')
    } catch (err) {
      setFormMsg(err.response?.data?.message || 'Failed to create session')
    }
  }

  const createBatch = async (e) => {
    e.preventDefault()
    setBatchMsg('')
    try {
      const { data } = await api.post('/batches', batchForm)
      setBatches(prev => [data, ...prev])
      setBatchForm({ name: '', institutionId: '', description: '' })
      setBatchMsg('✓ Batch created!')
    } catch (err) {
      setBatchMsg(err.response?.data?.message || 'Failed to create batch')
    }
  }

  const generateInvite = async (batchId) => {
    try {
      const { data } = await api.post(`/batches/${batchId}/invite`)
      setInviteResult(prev => ({ ...prev, [batchId]: data.inviteUrl }))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate invite')
    }
  }

  const viewAttendance = async (session) => {
    setSelectedSession(session)
    setAttendance(null)
    try {
      const { data } = await api.get(`/sessions/${session.id}/attendance`)
      setAttendance(data)
    } catch (err) {
      alert('Failed to load attendance')
    }
  }

  if (loading) return <div className="dashboard"><Navbar title="Trainer Dashboard" /><div className="content"><p>Loading...</p></div></div>

  return (
    <div className="dashboard">
      <Navbar title="Trainer Dashboard" />
      <div className="content">
        <h2>Welcome, {user?.firstName}</h2>

        <div className="tabs">
          {['sessions', 'batches', 'attendance'].map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <>
            <div className="card">
              <h3>Create Session</h3>
              <form onSubmit={createSession} className="form-grid">
                <input placeholder="Session title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                <select value={form.batchId} onChange={e => setForm(p => ({ ...p, batchId: e.target.value }))} required>
                  <option value="">Select batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                <input type="time" placeholder="Start time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} required />
                <input type="time" placeholder="End time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} required />
                <button type="submit" className="btn btn-primary">Create Session</button>
              </form>
              {formMsg && <p className={formMsg.startsWith('✓') ? 'success-msg' : 'error-msg'}>{formMsg}</p>}
            </div>

            <div className="card">
              <h3>My Sessions</h3>
              {sessions.length === 0 ? <p className="empty-state">No sessions yet.</p> : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Title</th><th>Batch</th><th>Date</th><th>Time</th><th>Action</th></tr></thead>
                    <tbody>
                      {sessions.map(s => (
                        <tr key={s.id}>
                          <td>{s.title}</td>
                          <td>{s.batch?.name}</td>
                          <td>{new Date(s.date).toLocaleDateString()}</td>
                          <td>{s.startTime} – {s.endTime}</td>
                          <td><button className="btn btn-sm btn-primary" onClick={() => { setActiveTab('attendance'); viewAttendance(s) }}>View Attendance</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <>
            <div className="card">
              <h3>Create Batch</h3>
              <form onSubmit={createBatch} className="form-grid">
                <input placeholder="Batch name" value={batchForm.name} onChange={e => setBatchForm(p => ({ ...p, name: e.target.value }))} required />
                <select value={batchForm.institutionId} onChange={e => setBatchForm(p => ({ ...p, institutionId: e.target.value }))} required>
                  <option value="">Select institution</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <input placeholder="Description (optional)" value={batchForm.description} onChange={e => setBatchForm(p => ({ ...p, description: e.target.value }))} />
                <button type="submit" className="btn btn-primary">Create Batch</button>
              </form>
              {batchMsg && <p className={batchMsg.startsWith('✓') ? 'success-msg' : 'error-msg'}>{batchMsg}</p>}
            </div>

            <div className="card">
              <h3>My Batches</h3>
              {batches.length === 0 ? <p className="empty-state">No batches yet.</p> : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Name</th><th>Students</th><th>Sessions</th><th>Invite Link</th></tr></thead>
                    <tbody>
                      {batches.map(b => (
                        <tr key={b.id}>
                          <td>{b.name}</td>
                          <td>{b._count?.students ?? '—'}</td>
                          <td>{b._count?.sessions ?? '—'}</td>
                          <td>
                            {inviteResult[b.id] ? (
                              <div className="invite-box">
                                <input readOnly value={inviteResult[b.id]} className="invite-input" />
                                <button className="btn btn-sm" onClick={() => { navigator.clipboard.writeText(inviteResult[b.id]); alert('Copied!') }}>Copy</button>
                              </div>
                            ) : (
                              <button className="btn btn-sm btn-primary" onClick={() => generateInvite(b.id)}>Generate</button>
                            )}
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

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="card">
            <h3>Session Attendance {selectedSession && `— ${selectedSession.title}`}</h3>
            {!selectedSession && <p className="empty-state">Select a session from the Sessions tab to view attendance.</p>}
            {selectedSession && !attendance && <p>Loading attendance...</p>}
            {attendance && (
              <>
                <p>{attendance.batch?.students?.length} students enrolled</p>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Student</th><th>Email</th><th>Status</th></tr></thead>
                    <tbody>
                      {attendance.batch?.students?.map(student => {
                        const record = attendance.attendances?.find(a => a.studentId === student.id)
                        return (
                          <tr key={student.id}>
                            <td>{student.name}</td>
                            <td>{student.email}</td>
                            <td>
                              <span className={`badge badge-${record?.status || 'none'}`}>
                                {record?.status || 'Not marked'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
