import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'

export default function DashboardShell() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>

      {/* Mobile overlay */}
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:99, display:'none' }}
          className="mobile-overlay"/>
      )}

      <Sidebar mobileOpen={open} onClose={() => setOpen(false)} />

      <div style={{ marginLeft:'var(--sidebar-w)', flex:1, display:'flex', flexDirection:'column' }}
           className="main-content">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main style={{ padding:'24px 28px', flex:1 }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  )
}
