import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import s from './Topbar.module.css'

const TITLES = {
  '/dashboard': 'Overview',
  '/dashboard/campaigns':   'Campaigns',
  '/dashboard/submissions': 'Submissions',
  '/dashboard/stories':     'Stories',
  '/dashboard/settings':    'Settings',
}

export default function Topbar({ onToggleSidebar }) {
  const { pathname } = useLocation()
  const { brand }    = useAuth()
  const date = new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
  return (
    <header className={s.topbar}>
      <div className={s.left}>
        <button className={s.hamburger} onClick={onToggleSidebar} aria-label="Toggle menu">
          ☰
        </button>
        <div>
          <div className={s.title}>{TITLES[pathname] || 'Dashboard'}</div>
          <div className={s.date}>{date}</div>
        </div>
      </div>
      <div className={s.badge}>
        <div className={s.dot} />
        {brand?.name}
      </div>
    </header>
  )
}
