import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute    from './router/ProtectedRoute'
import DashboardShell    from './components/layout/DashboardShell'

import Login       from './pages/auth/Login'
import Register    from './pages/auth/Register'
import Overview    from './pages/dashboard/Overview'
import Campaigns   from './pages/dashboard/Campaigns'
import Submissions from './pages/dashboard/Submissions'
import Stories     from './pages/dashboard/Stories'
import Settings    from './pages/dashboard/Settings'
import Submit      from './pages/public/Submit'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public pages */}
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/submit/:slug" element={<Submit />} />

          {/* Protected dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardShell /></ProtectedRoute>}>
            <Route index              element={<Overview />} />
            <Route path="campaigns"   element={<Campaigns />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="stories"     element={<Stories />} />
            <Route path="settings"    element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
