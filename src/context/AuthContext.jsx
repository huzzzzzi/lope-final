import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, token } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [brand,   setBrand]   = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on page load
  useEffect(() => {
    if (!token.get()) { setLoading(false); return }
    api.get('/auth/me')
      .then(d => setBrand(d.brand))
      .catch(() => token.clear())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const d = await api.post('/auth/login', { email, password })
      token.set(d.token)
      setBrand(d.brand)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }, [])

  const register = useCallback(async (name, email, password) => {
    try {
      const d = await api.post('/auth/register', { name, email, password })
      token.set(d.token)
      setBrand(d.brand)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }, [])

  const logout      = useCallback(() => { token.clear(); setBrand(null) }, [])
  const updateBrand = useCallback(updates => setBrand(prev => prev ? { ...prev, ...updates } : prev), [])

  return (
    <AuthContext.Provider value={{ brand, loading, login, register, logout, updateBrand }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
