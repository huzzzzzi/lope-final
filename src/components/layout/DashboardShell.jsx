import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'
import s from './DashboardShell.module.css'

export default function DashboardShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className={s.shell}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className={s.overlay} onClick={() => setSidebarOpen(false)} />}
      <div className={s.main}>
        <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <main style={{ padding:'24px 28px', flex:1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
