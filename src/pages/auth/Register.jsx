import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import s from './Auth.module.css'

export default function Register() {
  const { register } = useAuth()
  const toast        = useToast()
  const navigate     = useNavigate()
  const [form, setF] = useState({ name:'', email:'', password:'', confirm:'' })
  const [errs, setE] = useState({})
  const [apiErr, setApiErr] = useState('')
  const [loading, setL]     = useState(false)

  const upd = (k, v) => { setF(p => ({ ...p, [k]:v })); setE(p => ({ ...p, [k]:'' })); setApiErr('') }

  async function submit(ev) {
    ev.preventDefault()
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name    = '2+ characters required'
    if (!/\S+@\S+\.\S+/.test(form.email))                 e.email   = 'Valid email required'
    if (form.password.length < 8)                          e.password = '8+ characters required'
    if (form.password !== form.confirm)                    e.confirm  = 'Passwords do not match'
    if (Object.keys(e).length) { setE(e); return }
    setL(true)
    const r = await register(form.name.trim(), form.email, form.password)
    setL(false)
    if (r.ok) { toast.success('Account created!'); navigate('/dashboard') }
    else setApiErr(r.error)
  }

  const fields = [
    { k:'name',    l:'Brand Name',        t:'text',     p:'e.g. Nike' },
    { k:'email',   l:'Email',             t:'email',    p:'you@brand.com' },
    { k:'password',l:'Password',          t:'password', p:'Min 8 characters' },
    { k:'confirm', l:'Confirm Password',  t:'password', p:'Repeat password' },
  ]

  return (
    <div className={s.shell}>
      <div className={s.card}>
        <div className={s.logo}>
          <div className={s.mark}><div className={s.mL}/><div className={s.mB}/><div className={s.mD}/></div>
          <span className={s.logoText}>LOPE</span>
        </div>
        <h1 className={s.heading}>Create your brand</h1>
        <p className={s.sub}>Start collecting UGC in minutes</p>
        {apiErr && <div className={s.err}>{apiErr}</div>}
        <form onSubmit={submit} noValidate>
          {fields.map(({ k, l, t, p }) => (
            <div className="form-group" key={k}>
              <label className="form-label">{l} *</label>
              <input className={`form-input${errs[k]?' error':''}`} type={t} placeholder={p} value={form[k]} onChange={e => upd(k, e.target.value)} />
              {errs[k] && <div className="form-error">{errs[k]}</div>}
            </div>
          ))}
          <Button type="submit" size="lg" fullWidth loading={loading}>Create account</Button>
        </form>
        <div className={s.sw}>Have an account? <Link to="/login" className={s.swLink}>Sign in</Link></div>
      </div>
    </div>
  )
}
