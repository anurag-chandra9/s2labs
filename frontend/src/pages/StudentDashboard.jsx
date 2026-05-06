import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import Navbar from '../components/Navbar'
import api from '../lib/api'

export default function StudentDashboard() {
  const { user } = useUser()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState('')
  const [joinMsg, setJoinMsg] = useState('')
  const [markingId, setMarkingId] = useState(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/sessions/student')
      setSessions(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const joinBatch = async (e) => {
    e.preventDefault()
    setJoinMsg('')
    try {
      const { data } = await api.post(`/batches/${inviteCode}/join`)
      setJoinMsg(`✓ Joined "${data.batchName}" successfully!`)
      setInviteCode('')
      fetchSessions()
    } catch (err) {
      setJoinMsg(err.response?.data?.message || 'Failed to join batch')
    }
  }

  const markAttendance = async (sessionId, status) => {
    setMarkingId(sessionId)
    try {
      await api.post('/attendance/mark', { sessionId, status })
      fetchSessions()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark attendance')
    } finally {
      setMarkingId(null)
    }
  }

  return (
    <div className="dashboard">
      <Navbar title="Student Dashboard" />
      <div className="content">
        <h2>Welcome, {user?.firstName}</h2>

        {/* Join Batch */}
        <div className="card">
          <h3>Join a Batch</h3>
          <form onSubmit={joinBatch} className="inline-form">
            <input
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">Join</button>
          </form>
          {joinMsg && <p className={joinMsg.startsWith('✓') ? 'success-msg' : 'error-msg'}>{joinMsg}</p>}
        </div>

        {/* Sessions */}
        <div className="card">
          <h3>My Sessions</h3>
          {loading ? (
            <p>Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="empty-state">No sessions yet. Join a batch to get started.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Batch</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const myAttendance = s.attendances?.[0]
                    return (
                      <tr key={s.id}>
                        <td>{s.title}</td>
                        <td>{s.batch?.name}</td>
                        <td>{new Date(s.date).toLocaleDateString()}</td>
                        <td>{s.startTime} – {s.endTime}</td>
                        <td>
                          {myAttendance ? (
                            <span className={`badge badge-${myAttendance.status}`}>
                              {myAttendance.status}
                            </span>
                          ) : (
                            <span className="badge badge-none">Not marked</span>
                          )}
                        </td>
                        <td>
                          {!myAttendance && (
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-success"
                                disabled={markingId === s.id}
                                onClick={() => markAttendance(s.id, 'present')}
                              >Present</button>
                              <button
                                className="btn btn-sm btn-warning"
                                disabled={markingId === s.id}
                                onClick={() => markAttendance(s.id, 'late')}
                              >Late</button>
                              <button
                                className="btn btn-sm btn-danger"
                                disabled={markingId === s.id}
                                onClick={() => markAttendance(s.id, 'absent')}
                              >Absent</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
