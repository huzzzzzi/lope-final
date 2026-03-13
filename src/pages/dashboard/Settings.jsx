import { useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'

function Section({ title, sub, children }) {
  return (
    <div style={{ marginBottom:32 }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--ink)', marginBottom:3 }}>{title}</div>
      <div style={{ fontSize:13, color:'var(--stone)', marginBottom:20 }}>{sub}</div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { brand, updateBrand } = useAuth()
  const toast = useToast()
  const [prof, setProf]   = useState({ name: brand?.name||'', email: brand?.email||'' })
  const [profE, setProfE] = useState({})
  const [profL, setProfL] = useState(false)
  const [pass, setPass]   = useState({ current:'', next:'', confirm:'' })
  const [passE, setPassE] = useState({})
  const [passL, setPassL] = useState(false)

  async function saveProfile(e) {
    e.preventDefault()
    const errs = {}
    if (!prof.name.trim() || prof.name.trim().length < 2) errs.name  = '2+ characters required'
    if (!/\S+@\S+\.\S+/.test(prof.email))                  errs.email = 'Valid email required'
    if (Object.keys(errs).length) { setProfE(errs); return }
    setProfL(true)
    try {
      const d = await api.patch('/auth/profile', { name: prof.name.trim(), email: prof.email })
      updateBrand({ name: d.brand.name, email: d.brand.email })
      toast.success('Profile saved!')
    } catch (e) { setProfE({ g: e.message }) }
    finally { setProfL(false) }
  }

  async function savePassword(e) {
    e.preventDefault()
    const errs = {}
    if (!pass.current)           errs.current = 'Required'
    if (pass.next.length < 8)    errs.next    = '8+ characters required'
    if (pass.next !== pass.confirm) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) { setPassE(errs); return }
    setPassL(true)
    try {
      await api.patch('/auth/password', { currentPassword: pass.current, newPassword: pass.next })
      setPass({ current:'', next:'', confirm:'' })
      toast.success('Password updated!')
    } catch (e) { setPassE({ current: e.message }) }
    finally { setPassL(false) }
  }

  return (
    <div className="fade-up" style={{ maxWidth:560 }}>
      <div className="page-header"><div><h1 className="page-title">Settings</h1><p className="page-sub">Manage your brand profile and security</p></div></div>

      <Section title="Brand Profile" sub="Update your brand name and login email">
        {profE.g && <div style={{ padding:'10px 14px', background:'var(--ember-light)', border:'1px solid #f4c4b8', borderRadius:'var(--r-md)', color:'var(--ember)', fontSize:13, marginBottom:16 }}>{profE.g}</div>}
        <form onSubmit={saveProfile} noValidate>
          {[{k:'name',l:'Brand Name',t:'text',p:'e.g. Nike'},{k:'email',l:'Email',t:'email',p:'you@brand.com'}].map(({ k,l,t,p }) => (
            <div className="form-group" key={k}>
              <label className="form-label">{l}</label>
              <input className={`form-input${profE[k]?' error':''}`} type={t} placeholder={p} value={prof[k]} onChange={e => { setProf(v=>({...v,[k]:e.target.value})); setProfE(v=>({...v,[k]:''})) }}/>
              {profE[k] && <div className="form-error">{profE[k]}</div>}
            </div>
          ))}
          <Button type="submit" loading={profL}>Save Profile</Button>
        </form>
      </Section>

      <hr style={{ border:'none', borderTop:'1px solid var(--mist)', margin:'32px 0' }}/>

      <Section title="Change Password" sub="Use a strong password to protect your account">
        <form onSubmit={savePassword} noValidate>
          {[{k:'current',l:'Current Password',p:'••••••••'},{k:'next',l:'New Password',p:'Min 8 characters'},{k:'confirm',l:'Confirm New Password',p:'Repeat'}].map(({ k,l,p }) => (
            <div className="form-group" key={k}>
              <label className="form-label">{l}</label>
              <input className={`form-input${passE[k]?' error':''}`} type="password" placeholder={p} value={pass[k]} onChange={e => { setPass(v=>({...v,[k]:e.target.value})); setPassE(v=>({...v,[k]:''})) }}/>
              {passE[k] && <div className="form-error">{passE[k]}</div>}
            </div>
          ))}
          <Button type="submit" variant="outline" loading={passL}>Change Password</Button>
        </form>
      </Section>

      <hr style={{ border:'none', borderTop:'1px solid var(--mist)', margin:'32px 0' }}/>

      <Section title="About" sub="Technical information about this deployment">
        <div style={{ padding:'14px 16px', background:'var(--smoke)', borderRadius:'var(--r-lg)', border:'1px solid var(--mist)' }}>
          {[['Version','2.0.0'],['Frontend','React 18 + Vite'],['Backend','Vercel Serverless Functions'],['Database','Neon PostgreSQL'],['Auth','JWT (7 day expiry)'],['File Uploads','Cloudinary (direct browser upload)']].map(([l,v]) => (
            <div key={l} style={{ display:'flex', gap:12, padding:'6px 0', borderBottom:'1px solid var(--mist)', fontSize:13 }}>
              <span style={{ color:'var(--stone)', minWidth:120 }}>{l}</span>
              <span style={{ color:'var(--ink)', fontWeight:500 }}>{v}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
