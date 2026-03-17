import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import s from './Sidebar.module.css'

const NAV = [
  { section: 'Main', items: [
    { to: '/dashboard',             end: true, icon: '◈', label: 'Overview'    },
    { to: '/dashboard/campaigns',   icon: '📣', label: 'Campaigns'   },
    { to: '/dashboard/submissions', icon: '📸', label: 'Submissions' },
    { to: '/dashboard/stories',     icon: '✦',  label: 'Stories'     },
  ]},
  { section: 'Account', items: [
    { to: '/dashboard/settings', icon: '⚙', label: 'Settings' },
  ]},
]

const initials = name => (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

export default function Sidebar({ isOpen, onClose }) {
  const { brand, logout } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()
  return (
    <aside className={`${s.sidebar} ${isOpen ? s.open : ''}`}>
      <div className={s.logo}>
        <div className={s.mark}><div className={s.mL}/><div className={s.mB}/><div className={s.mD}/></div>
        <span className={s.logoText}>LOPE</span>
        <span className={s.ver}>v2</span>
      </div>
      <nav className={s.nav}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div className={s.sec}>{section}</div>
            {items.map(({ to, end, icon, label }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => [s.link, isActive ? s.active : ''].join(' ')}
                onClick={onClose}>
                <span className={s.icon}>{icon}</span>{label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className={s.footer}>
        <div className={s.avatar}>{initials(brand?.name)}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className={s.bName}>{brand?.name}</div>
          <div className={s.bEmail}>{brand?.email}</div>
        </div>
        <button className={s.logoutBtn} title="Sign out"
          onClick={() => { logout(); toast.success('Signed out'); navigate('/login') }}>
          ↩
        </button>
      </div>
    </aside>
  )
}
