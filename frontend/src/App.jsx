import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, useUser, useAuth } from '@clerk/clerk-react'
import { setAuthToken } from './lib/api'
import api from './lib/api'
import StudentDashboard from './pages/StudentDashboard'
import TrainerDashboard from './pages/TrainerDashboard'
import InstitutionDashboard from './pages/InstitutionDashboard'
import ProgrammeManagerDashboard from './pages/ProgrammeManagerDashboard'
import MonitoringOfficerDashboard from './pages/MonitoringOfficerDashboard'
import JoinBatch from './pages/JoinBatch'
import './App.css'

export default function App() {
  const { isSignedIn, user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [role, setRole] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    if (!isSignedIn || !isLoaded) return

    setSyncing(true)
    getToken()
      .then(async (token) => {
        setAuthToken(token)
        try {
          const { data } = await api.post('/users/sync')
          setRole(data.role)
        } catch (err) {
          const msg = err.response?.data?.message || ''
          setSyncError(msg || 'Failed to sync user')
        }
      })
      .finally(() => setSyncing(false))
  }, [isSignedIn, isLoaded])

  if (!isLoaded || (isSignedIn && syncing && !role)) {
    return (
      <div className="auth-container">
        <div className="join-card">
          <h2>SkillBridge</h2>
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="auth-container">
        <Routes>
          <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
          <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
          <Route path="*" element={<Navigate to="/sign-in" replace />} />
        </Routes>
      </div>
    )
  }

  if (!role) {
    return (
      <div className="auth-container">
        <div className="join-card">
          <h2>SkillBridge</h2>
          {syncError ? (
            <>
              <p style={{ marginTop: '1rem', color: '#ef4444' }}>Role not set on your account.</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                Go to <strong>Clerk dashboard → Users → {user?.primaryEmailAddress?.emailAddress}</strong>
              </p>
              <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                → Metadata → Public → paste and save:
              </p>
              <pre style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem', fontSize: '0.8rem', textAlign: 'left' }}>
{`{ "role": "trainer" }`}
              </pre>
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                Valid: student · trainer · institution · programme_manager · monitoring_officer
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem', width: '100%' }}
                onClick={() => { setSyncError(''); setSyncing(false); setRole(null); window.location.reload() }}
              >
                Retry
              </button>
            </>
          ) : (
            <p style={{ marginTop: '1rem', color: '#64748b' }}>Syncing...</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/join/:inviteCode" element={<JoinBatch />} />
      <Route path="/" element={<RoleRedirect role={role} />} />
      <Route path="/student"           element={role === 'student'            ? <StudentDashboard />           : <Navigate to="/" />} />
      <Route path="/trainer"           element={role === 'trainer'            ? <TrainerDashboard />           : <Navigate to="/" />} />
      <Route path="/institution"       element={role === 'institution'        ? <InstitutionDashboard />       : <Navigate to="/" />} />
      <Route path="/programme-manager" element={role === 'programme_manager'  ? <ProgrammeManagerDashboard /> : <Navigate to="/" />} />
      <Route path="/monitoring-officer"element={role === 'monitoring_officer' ? <MonitoringOfficerDashboard />: <Navigate to="/" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RoleRedirect({ role }) {
  const map = {
    student: '/student',
    trainer: '/trainer',
    institution: '/institution',
    programme_manager: '/programme-manager',
    monitoring_officer: '/monitoring-officer',
  }
  return <Navigate to={map[role] || '/sign-in'} replace />
}
