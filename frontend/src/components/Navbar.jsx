import { UserButton, useUser } from '@clerk/clerk-react'

const roleLabels = {
  student: 'Student',
  trainer: 'Trainer',
  institution: 'Institution',
  programme_manager: 'Programme Manager',
  monitoring_officer: 'Monitoring Officer',
}

export default function Navbar({ title }) {
  const { user } = useUser()
  const role = user?.publicMetadata?.role

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="navbar-brand">SkillBridge</span>
        {title && <span className="navbar-title">{title}</span>}
      </div>
      <div className="navbar-right">
        <span className="role-badge">{roleLabels[role] || role}</span>
        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  )
}
