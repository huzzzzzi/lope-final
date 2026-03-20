import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'
import s from './Submit.module.css'

const ALLOWED       = ['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const Logo = () => (
  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
    <div style={{ width:26, height:26, position:'relative' }}>
      <div style={{ position:'absolute', bottom:0, left:0, width:8, height:21, background:'var(--forest)', borderRadius:3 }}/>
      <div style={{ position:'absolute', bottom:0, left:0, width:20, height:8, background:'var(--forest)', borderRadius:'0 0 3px 3px' }}/>
      <div style={{ position:'absolute', top:0, right:0, width:9, height:9, borderRadius:'50%', background:'var(--amber)' }}/>
    </div>
    <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:17, letterSpacing:'-.5px', color:'var(--ink)' }}>LOPE</span>
  </div>
)

async function uploadToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.')
  }
  const type = file.type.startsWith('video/') ? 'video' : 'image'
  const fd   = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`, { method:'POST', body:fd })
  if (!res.ok) throw new Error('File upload failed — please try again')
  const data = await res.json()
  return { url: data.secure_url, type }
}

export default function Submit() {
  const { slug }         = useParams()
  const [campaign, setCamp] = useState(null)
  const [page, setPage]     = useState('loading')
  const [form, setForm]     = useState({ name:'', contact:'', message:'', customAnswers:{}, agreed:false })
  const [file, setFile]     = useState(null)
  const [preview, setPrev]  = useState(null)
  const [errors, setErrs]   = useState({})
  const [apiErr, setApiErr] = useState('')
  const [loading, setLoad]  = useState(false)
  const [progress, setProgress] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    api.public.get('/public/' + slug)
      .then(d => { if (d.campaign) { setCamp(d.campaign); setPage('form') } else setPage('error') })
      .catch(() => setPage('error'))
  }, [slug])

  const upd = (k, v) => { setForm(p => ({ ...p, [k]:v })); setErrs(p => ({ ...p, [k]:'' })); setApiErr('') }

  function handleFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    if (!ALLOWED.includes(f.type))     { setErrs(p => ({ ...p, file:'Use JPG, PNG, WebP or MP4' })); return }
    if (f.size > 20 * 1024 * 1024)    { setErrs(p => ({ ...p, file:'Max file size is 20 MB' }));    return }
    setFile(f); setErrs(p => ({ ...p, file:'' }))
    if (f.type.startsWith('image/')) { const r=new FileReader(); r.onload=e=>setPrev(e.target.result); r.readAsDataURL(f) }
    else setPrev('video')
  }

  async function submit(ev) {
    ev.preventDefault()
    const e = {}
    if (!form.name.trim())    e.name    = 'Name is required'
    if (!form.contact.trim()) e.contact = 'Email or phone is required'
    if (!file)                e.file    = 'Please upload a photo or video'
    if (!form.agreed)         e.agreed  = 'Please accept the terms to continue'
    campaign?.customFields?.forEach(f => { if (f.required && !form.customAnswers[f.id]?.trim()) e['cf_'+f.id] = f.label + ' is required' })
    if (Object.keys(e).length) { setErrs(e); return }

    setLoad(true); setApiErr(''); setProgress('Uploading photo to cloud…')
    try {
      const { url: mediaUrl, type: mediaType } = await uploadToCloudinary(file)
      setProgress('Submitting…')
      const d = await api.public.post('/public/' + slug + '/submit', {
        name:form.name.trim(), contact:form.contact.trim(), message:form.message.trim(),
        customAnswers:form.customAnswers, mediaUrl, mediaType,
      })
      setPage('success')
    } catch (e) {
      setApiErr(e.message)
    } finally {
      setLoad(false); setProgress('')
    }
  }

  if (page === 'loading') return <div className={s.shell}><div className={s.card}><Logo/><div style={{ textAlign:'center', padding:20, color:'var(--stone)' }}>Loading campaign…</div></div></div>
  if (page === 'error')   return (
    <div className={s.shell}><div className={s.card}><Logo/>
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <div style={{ fontSize:48, marginBottom:14 }}>🔍</div>
        <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:8 }}>Campaign not found</h2>
        <p style={{ color:'var(--stone)' }}>This link may be expired or invalid.</p>
      </div>
    </div></div>
  )
  if (page === 'success') return (
    <div className={s.shell}><div className={s.card}><Logo/>
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--forest-tint)', border:'2px solid var(--forest)', color:'var(--forest)', fontSize:28, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>✓</div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--ink)', marginBottom:10 }}>You're in!</h2>
        <p style={{ fontSize:14, color:'var(--stone)', lineHeight:1.7 }}>Thanks <strong>{form.name}</strong>! Your submission to <strong>{campaign?.name}</strong> has been received and will be reviewed shortly.</p>
      </div>
    </div></div>
  )

  return (
    <div className={s.shell}>
      <div className={s.card}>
        <Logo />
        <div className={s.hero} style={{ background: campaign?.coverColor || '#1c4a3b' }}>
          <h1 className={s.heroTitle}>{campaign?.name}</h1>
          {campaign?.description && <p className={s.heroDesc}>{campaign.description}</p>}
          {campaign?.submissionCount > 0 && (
            <div className={s.heroBadge}>📸 {campaign.submissionCount} {campaign.submissionCount===1?'person has':'people have'} shared their story</div>
          )}
        </div>

        {apiErr && <div style={{ padding:'10px 14px', background:'var(--ember-light)', border:'1px solid #f4c4b8', borderRadius:'var(--r-md)', color:'var(--ember)', fontSize:13, margin:'16px 0' }}>{apiErr}</div>}

        <form onSubmit={submit} noValidate style={{ marginTop:20 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Your Name *</label>
              <input className={`form-input${errors.name?' error':''}`} placeholder="Full name" value={form.name} onChange={e => upd('name', e.target.value)}/>
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email or Phone *</label>
              <input className={`form-input${errors.contact?' error':''}`} placeholder="email or +1 555…" value={form.contact} onChange={e => upd('contact', e.target.value)}/>
              {errors.contact && <div className="form-error">{errors.contact}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Photo or Video *</label>
            <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime" onChange={handleFile} style={{ display:'none' }} id="fu"/>
            {!file ? (
              <label htmlFor="fu" className={s.drop+(errors.file?' '+s.dropErr:'')}>
                <div style={{ fontSize:36, marginBottom:8 }}>📸</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--ink)', marginBottom:4 }}>Click to upload</div>
                <div style={{ fontSize:12, color:'var(--stone)' }}>JPG, PNG, WebP, MP4 · Max 20 MB</div>
              </label>
            ) : (
              <div style={{ border:'1px solid var(--mist)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
                {preview === 'video'
                  ? <div style={{ padding:20, background:'var(--smoke)', textAlign:'center', fontSize:13.5 }}>🎬 {file.name}</div>
                  : <img src={preview} alt="" style={{ width:'100%', maxHeight:260, objectFit:'cover' }}/>}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', fontSize:12.5, color:'var(--stone)' }}>
                  <span>{file.name}</span>
                  <button type="button" onClick={() => { setFile(null); setPrev(null); if (fileRef.current) fileRef.current.value='' }} style={{ background:'none', border:'none', color:'var(--ember)', fontWeight:600, cursor:'pointer' }}>✕ Remove</button>
                </div>
              </div>
            )}
            {errors.file && <div className="form-error">{errors.file}</div>}
          </div>

          {campaign?.customFields?.map(f => (
            <div className="form-group" key={f.id}>
              <label className="form-label">{f.label}{f.required && <span style={{ color:'var(--ember)', marginLeft:2 }}>*</span>}</label>
              {f.type === 'textarea' ? (
                <textarea className={`form-input${errors['cf_'+f.id]?' error':''}`} rows={3} placeholder={f.placeholder}
                  value={form.customAnswers[f.id]||''}
                  onChange={e => { setForm(p=>({...p,customAnswers:{...p.customAnswers,[f.id]:e.target.value}})); setErrs(p=>({...p,['cf_'+f.id]:''})) }}/>
              ) : (
                <input className={`form-input${errors['cf_'+f.id]?' error':''}`} type="text" placeholder={f.placeholder}
                  value={form.customAnswers[f.id]||''}
                  onChange={e => { setForm(p=>({...p,customAnswers:{...p.customAnswers,[f.id]:e.target.value}})); setErrs(p=>({...p,['cf_'+f.id]:''})) }}/>
              )}
              {errors['cf_'+f.id] && <div className="form-error">{errors['cf_'+f.id]}</div>}
            </div>
          ))}

          <div className="form-group">
            <label className="form-label">Message <span style={{ color:'var(--stone)', fontWeight:400 }}>(optional)</span></label>
            <textarea className="form-input" placeholder="Share a caption or story…" rows={3} value={form.message} onChange={e => upd('message', e.target.value)}/>
          </div>

          <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:4 }}>
            <input type="checkbox" id="tc" checked={form.agreed} onChange={e => upd('agreed', e.target.checked)} style={{ marginTop:3, width:16, height:16, accentColor:'var(--forest)', cursor:'pointer' }}/>
            <label htmlFor="tc" style={{ fontSize:12.5, color:'var(--stone)', cursor:'pointer', lineHeight:1.5 }}>
              I agree my photo/video may be used for marketing purposes and confirm I own the rights to this content.
            </label>
          </div>
          {errors.agreed && <div className="form-error" style={{ marginBottom:12 }}>{errors.agreed}</div>}

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? (progress || 'Uploading…') : 'Submit my photo ✦'}
          </Button>
        </form>
        <div style={{ textAlign:'center', marginTop:20, fontSize:11.5, color:'var(--fog)' }}>Powered by <strong>LOPE</strong></div>
      </div>
    </div>
  )
}
