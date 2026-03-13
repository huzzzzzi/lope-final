import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)
let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((msg, type = 'info', duration = 3000) => {
    const id = ++_id
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const toast = {
    success: (msg, dur)  => add(msg, 'success', dur),
    error:   (msg, dur)  => add(msg, 'error',   dur || 4500),
    info:    (msg, dur)  => add(msg, 'info',    dur),
  }

  const dismiss = id => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(({ id, msg, type }) => (
          <div key={id} className={`toast toast-${type}`} onClick={() => dismiss(id)}>
            {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'} {msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
