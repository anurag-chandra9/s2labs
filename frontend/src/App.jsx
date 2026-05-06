import { Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, useUser } from '@clerk/clerk-react'
import { useApiAuth } from './hooks/useApi'
import StudentDashboard from './pages/StudentDashboard'
import TrainerDashboard from './pages/TrainerDashboard'
import InstitutionDashboard from './pages/InstitutionDashboard'
import ProgrammeManagerDashboard from './pages/ProgrammeManagerDashboard'
import MonitoringOfficerDashboard from './pages/MonitoringOfficerDashboard'
import JoinBatch from './pages/JoinBatch'
import './App.css'

function App() {
  useApiAuth()
  const { isSignedIn, user } = useUser()

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

  const role = user?.publicMetadata?.role

  return (
    <Routes>
      <Route path="/join/:inviteCode" element={<JoinBatch />} />
      <Route path="/" element={<RoleBasedRedirect role={role} />} />
      <Route path="/student" element={role === 'student' ? <StudentDashboard /> : <Navigate to="/" />} />
      <Route path="/trainer" element={role === 'trainer' ? <TrainerDashboard /> : <Navigate to="/" />} />
      <Route path="/institution" element={role === 'institution' ? <InstitutionDashboard /> : <Navigate to="/" />} />
      <Route path="/programme-manager" element={role === 'programme_manager' ? <ProgrammeManagerDashboard /> : <Navigate to="/" />} />
      <Route path="/monitoring-officer" element={role === 'monitoring_officer' ? <MonitoringOfficerDashboard /> : <Navigate to="/" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RoleBasedRedirect({ role }) {
  if (role === 'student') return <Navigate to="/student" replace />
  if (role === 'trainer') return <Navigate to="/trainer" replace />
  if (role === 'institution') return <Navigate to="/institution" replace />
  if (role === 'programme_manager') return <Navigate to="/programme-manager" replace />
  if (role === 'monitoring_officer') return <Navigate to="/monitoring-officer" replace />
  return <div>Role not set. Please contact admin.</div>
}

export default App
