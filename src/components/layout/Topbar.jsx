import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
const TITLES = {
  '/dashboard': 'Overview',
  '/dashboard/campaigns':   'Campaigns',
  '/dashboard/submissions': 'Submissions',
  '/dashboard/stories':     'Stories',
  '/dashboard/settings':    'Settings',
}
export default function Topbar() {
  const { pathname } = useLocation()
  const { brand }    = useAuth()
  const date = new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
  return (
    <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:'var(--topbar-h)', padding:'0 28px', background:'var(--white)', borderBottom:'1px solid var(--mist)', position:'sticky', top:0, zIndex:50 }}>
      <div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--ink)' }}>{TITLES[pathname] || 'Dashboard'}</div>
        <div style={{ fontSize:12, color:'var(--stone)' }}>{date}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:'var(--r-pill)', background:'var(--smoke)', border:'1px solid var(--mist)', fontFamily:'var(--font-display)', fontSize:12.5, fontWeight:600, color:'var(--slate)' }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--forest)' }} />
        {brand?.name}
      </div>
    </header>
  )
}
