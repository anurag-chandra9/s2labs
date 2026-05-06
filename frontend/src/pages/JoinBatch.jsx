import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import api from '../lib/api'

export default function JoinBatch() {
  const { inviteCode } = useParams()
  const { user } = useUser()
  const navigate = useNavigate()
  const [status, setStatus] = useState('joining') // joining | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return
    const role = user?.publicMetadata?.role
    if (role !== 'student') {
      setStatus('error')
      setMessage('Only students can join batches via invite links.')
      return
    }

    api.post(`/batches/${inviteCode}/join`)
      .then(({ data }) => {
        setStatus('success')
        setMessage(`You've joined "${data.batchName}"!`)
        setTimeout(() => navigate('/student'), 2000)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Failed to join batch')
      })
  }, [user, inviteCode])

  return (
    <div className="auth-container">
      <div className="join-card">
        <h2>SkillBridge</h2>
        {status === 'joining' && <p>Joining batch...</p>}
        {status === 'success' && (
          <>
            <p className="success-msg">{message}</p>
            <p>Redirecting to your dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="error-msg">{message}</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Dashboard</button>
          </>
        )}
      </div>
    </div>
  )
}
