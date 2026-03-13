import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import s from './Auth.module.css'

export default function Login() {
  const { login }    = useAuth()
  const toast        = useToast()
  const navigate     = useNavigate()
  const [form, setF] = useState({ email:'', password:'' })
  const [errs, setE] = useState({})
  const [apiErr, setApiErr] = useState('')
  const [loading, setL]     = useState(false)

  const upd = (k, v) => { setF(p => ({ ...p, [k]:v })); setE(p => ({ ...p, [k]:'' })); setApiErr('') }

  async function submit(ev) {
    ev.preventDefault()
    const e = {}
    if (!form.email)    e.email    = 'Required'
    if (!form.password) e.password = 'Required'
    if (Object.keys(e).length) { setE(e); return }
    setL(true)
    const r = await login(form.email, form.password)
    setL(false)
    if (r.ok) { toast.success('Welcome back!'); navigate('/dashboard') }
    else setApiErr(r.error)
  }

  return (
    <div className={s.shell}>
      <div className={s.card}>
        <div className={s.logo}>
          <div className={s.mark}><div className={s.mL}/><div className={s.mB}/><div className={s.mD}/></div>
          <span className={s.logoText}>LOPE</span>
        </div>
        <h1 className={s.heading}>Welcome back</h1>
        <p className={s.sub}>Sign in to your brand dashboard</p>
        {apiErr && <div className={s.err}>{apiErr}</div>}
        <form onSubmit={submit} noValidate>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className={`form-input${errs.email?' error':''}`} type="email" placeholder="you@brand.com" value={form.email} onChange={e => upd('email', e.target.value)} />
            {errs.email && <div className="form-error">{errs.email}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className={`form-input${errs.password?' error':''}`} type="password" placeholder="••••••••" value={form.password} onChange={e => upd('password', e.target.value)} />
            {errs.password && <div className="form-error">{errs.password}</div>}
          </div>
          <Button type="submit" size="lg" fullWidth loading={loading}>Sign in</Button>
        </form>
        <div className={s.sw}>No account? <Link to="/register" className={s.swLink}>Create one</Link></div>
        <div className={s.demo}><strong>Demo:</strong> demo@lope.com / password123</div>
      </div>
    </div>
  )
}
