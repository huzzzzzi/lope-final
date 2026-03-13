import { useEffect, useRef } from 'react'
import s from './Modal.module.css'
export default function Modal({ isOpen, onClose, title, children, footer, size='md' }) {
  const ref = useRef()
  useEffect(() => {
    if (!isOpen) return
    const handle = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handle); document.body.style.overflow = '' }
  }, [isOpen, onClose])
  if (!isOpen) return null
  return (
    <div ref={ref} className={s.overlay} onClick={e => { if (e.target === ref.current) onClose() }}>
      <div className={[s.modal, s[size]].join(' ')}>
        <div className={s.header}>
          <h2 className={s.title}>{title}</h2>
          <button className={s.close} onClick={onClose}>✕</button>
        </div>
        <div className={s.body}>{children}</div>
        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>
  )
}
