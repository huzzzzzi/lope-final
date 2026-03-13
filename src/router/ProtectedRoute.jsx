import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Spinner() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--parchment)' }}>
      <div style={{ width:36, height:36, border:'3px solid var(--mist)', borderTopColor:'var(--forest)', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
      <style>{'@keyframes spin { to { transform:rotate(360deg) } }'}</style>
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const { brand, loading } = useAuth()
  if (loading) return <Spinner />
  if (!brand)  return <Navigate to="/login" replace />
  return children
}
