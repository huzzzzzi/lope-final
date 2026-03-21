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

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const { brand }    = useAuth()
  const date = new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
  return (
    <header className={s.topbar}>
      {/* Hamburger — mobile only */}
      <button onClick={onMenuClick} className="hamburger"
        style={{ display:'none', background:'none', border:'none', cursor:'pointer', padding:'4px 8px', marginRight:8 }}>
        <div style={{ width:20, height:2, background:'var(--ink)', margin:'4px 0', borderRadius:2 }}/>
        <div style={{ width:20, height:2, background:'var(--ink)', margin:'4px 0', borderRadius:2 }}/>
        <div style={{ width:20, height:2, background:'var(--ink)', margin:'4px 0', borderRadius:2 }}/>
      </button>
      <style>{`.hamburger { display: none !important; } @media(max-width:768px){ .hamburger { display: block !important; } }`}</style>
      <div className={s.left}>
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
