import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import Pill   from '../../components/ui/Pill'
import Modal  from '../../components/ui/Modal'
import s from './Campaigns.module.css'

const STATUS_COLOR  = { live:'green', ended:'gray', draft:'amber' }
const MOD_LABEL     = { manual:'Manual Review', ai:'AI Review', auto:'Auto-Approve' }
const COVER_COLORS  = ['#1c4a3b','#2d4fa8','#7a3b8c','#c43b2a','#2d6b57','#b07d1a','#1a4a6b','#3b3b8c']
const EMPTY         = { name:'', description:'', startDate:'', endDate:'', moderationType:'manual', coverColor:'#1c4a3b', customFields:[] }

export default function Campaigns() {
  const toast = useToast()
  const [camps,   setCamps]  = useState([])
  const [loading, setLoad]   = useState(true)
  const [filter,  setFilter] = useState('all')
  const [modal,   setModal]  = useState(null)   // null | 'create' | campaign obj
  const [form,    setForm]   = useState(EMPTY)
  const [errors,  setErrs]   = useState({})
  const [saving,  setSaving] = useState(false)
  const [delTarget, setDel]  = useState(null)
  const [deleting,  setDeling] = useState(false)
  const [shareTarget, setShare] = useState(null)

  const load = useCallback(async () => {
    setLoad(true)
    try { setCamps(await api.get('/campaigns' + (filter !== 'all' ? `?status=${filter}` : ''))) }
    catch (e) { toast.error(e.message) }
    finally { setLoad(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm(EMPTY); setErrs({}); setModal('create') }
  function openEdit(c)  { setForm({ name:c.name, description:c.description||'', startDate:c.startDate||'', endDate:c.endDate||'', moderationType:c.moderationType||'manual', coverColor:c.coverColor||'#1c4a3b', customFields:c.customFields||[] }); setErrs({}); setModal(c) }

  async function save() {
    const e = {}
    if (!form.name.trim()) e.name = 'Campaign name required'
    if (!form.startDate)   e.startDate = 'Start date required'
    if (!form.endDate)     e.endDate   = 'End date required'
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) e.endDate = 'Must be after start date'
    if (Object.keys(e).length) { setErrs(e); return }
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/campaigns', { name:form.name.trim(), description:form.description||null, startDate:form.startDate, endDate:form.endDate, moderationType:form.moderationType, coverColor:form.coverColor, customFields:form.customFields })
        toast.success('Campaign created!')
      } else {
        await api.patch(`/campaigns/${modal.id}`, { name:form.name.trim(), description:form.description||null, startDate:form.startDate, endDate:form.endDate, moderationType:form.moderationType, coverColor:form.coverColor, customFields:form.customFields })
        toast.success('Campaign updated!')
      }
      setModal(null); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function toggleStatus(c) {
    const next = c.status === 'live' ? 'ended' : 'live'
    try { await api.patch(`/campaigns/${c.id}`, { status:next }); toast.success(`Campaign set to ${next}`); load() }
    catch (e) { toast.error(e.message) }
  }

  async function confirmDelete() {
    if (!delTarget) return; setDeling(true)
    try { await api.delete(`/campaigns/${delTarget.id}`); toast.success('Campaign deleted'); setDel(null); load() }
    catch (e) { toast.error(e.message) }
    finally { setDeling(false) }
  }

  function addField()      { setForm(f => ({ ...f, customFields:[...f.customFields, { id:'cf_'+Date.now(), label:'', type:'text', required:false, placeholder:'' }] })) }
  function updField(i,k,v) { setForm(f => { const cf=[...f.customFields]; cf[i]={...cf[i],[k]:v}; return {...f,customFields:cf} }) }
  function remField(i)     { setForm(f => ({ ...f, customFields: f.customFields.filter((_,j)=>j!==i) })) }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div><h1 className="page-title">Campaigns</h1><p className="page-sub">{camps.length} campaigns</p></div>
        <Button icon="+" onClick={openCreate}>New Campaign</Button>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {['all','live','draft','ended'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={s.filterBtn+(filter===f?' '+s.filterActive:'')}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>

      {loading ? (
        <div className={s.grid}>{[0,1,2].map(i => <div key={i} className="skeleton" style={{ height:220, borderRadius:'var(--r-lg)' }}/>)}</div>
      ) : camps.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="icon">📣</div><h3>No campaigns yet</h3><p>Create your first campaign to start collecting UGC.</p><div style={{ marginTop:20 }}><Button onClick={openCreate}>Create Campaign</Button></div></div></div>
      ) : (
        <div className={s.grid}>
          {camps.map(c => (
            <div key={c.id} className={s.card}>
              <div className={s.cardTop} style={{ background: c.coverColor||'#1c4a3b' }}>
                <div className={s.cardPill}><Pill variant={STATUS_COLOR[c.status]||'gray'} dot>{c.status}</Pill></div>
                <div className={s.cardName}>{c.name}</div>
                <div className={s.cardCount}>{c._count?.submissions||0} submission{c._count?.submissions!==1?'s':''}</div>
              </div>
              <div className={s.cardBody}>
                <div className={s.meta}>
                  <span>{MOD_LABEL[c.moderationType]||'Manual'}</span>
                  <span>{new Date(c.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'})} — {new Date(c.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'})}</span>
                </div>
                {c.description && <p className={s.desc}>{c.description}</p>}
                <div className={s.actions}>
                  <Button size="sm" variant="ghost"   onClick={() => openEdit(c)}>Edit</Button>
                  <Button size="sm" variant="ghost"   onClick={() => toggleStatus(c)}>{c.status==='live'?'End':'Go Live'}</Button>
                  {c.status==='live' && <Button size="sm" variant="outline" onClick={() => setShare(c)}>Share</Button>}
                  <Button size="sm" variant="danger"  onClick={() => setDel(c)}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal==='create'?'New Campaign':'Edit Campaign'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button loading={saving} onClick={save}>{modal==='create'?'Create':'Save Changes'}</Button></>}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Campaign Name *</label>
            <input className={`form-input${errors.name?' error':''}`} placeholder="Summer Run 2025" value={form.name}
              onChange={e => { setForm(f=>({...f,name:e.target.value})); setErrs(p=>({...p,name:''})) }}/>
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Moderation</label>
            <select className="form-input" value={form.moderationType} onChange={e => setForm(f=>({...f,moderationType:e.target.value}))}>
              <option value="manual">Manual Review</option>
              <option value="auto">Auto-Approve</option>
              <option value="ai">AI-Assisted</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={2} placeholder="Tell customers about this campaign…" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}/>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <input className={`form-input${errors.startDate?' error':''}`} type="date" value={form.startDate}
              onChange={e => { setForm(f=>({...f,startDate:e.target.value})); setErrs(p=>({...p,startDate:''})) }}/>
            {errors.startDate && <div className="form-error">{errors.startDate}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">End Date *</label>
            <input className={`form-input${errors.endDate?' error':''}`} type="date" value={form.endDate}
              onChange={e => { setForm(f=>({...f,endDate:e.target.value})); setErrs(p=>({...p,endDate:''})) }}/>
            {errors.endDate && <div className="form-error">{errors.endDate}</div>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Cover Color</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
            {COVER_COLORS.map(col => (
              <button key={col} type="button" onClick={() => setForm(f=>({...f,coverColor:col}))}
                style={{ width:28, height:28, borderRadius:'50%', background:col, border:form.coverColor===col?'3px solid var(--ink)':'2px solid transparent', cursor:'pointer' }}/>
            ))}
          </div>
        </div>
        <div className="form-group">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <label className="form-label" style={{ marginBottom:0 }}>Custom Questions</label>
            <Button size="sm" variant="ghost" onClick={addField}>+ Add Question</Button>
          </div>
          {form.customFields.map((cf, i) => (
            <div key={cf.id} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
              <div style={{ flex:1 }}><input className="form-input" placeholder="Question label" value={cf.label} onChange={e => updField(i,'label',e.target.value)}/></div>
              <select className="form-input" style={{ width:110 }} value={cf.type} onChange={e => updField(i,'type',e.target.value)}><option value="text">Text</option><option value="textarea">Long text</option></select>
              <label style={{ display:'flex', alignItems:'center', gap:4, padding:'9px 0', fontSize:12.5, color:'var(--stone)', whiteSpace:'nowrap', cursor:'pointer' }}>
                <input type="checkbox" checked={cf.required} onChange={e => updField(i,'required',e.target.checked)} style={{ accentColor:'var(--forest)' }}/>Required
              </label>
              <button type="button" onClick={() => remField(i)} style={{ padding:'9px 10px', background:'var(--ember-light)', border:'1px solid #f4c4b8', borderRadius:'var(--r-sm)', color:'var(--ember)', cursor:'pointer', fontWeight:700, flexShrink:0 }}>✕</button>
            </div>
          ))}
          {form.customFields.length === 0 && <div style={{ padding:'12px 16px', background:'var(--smoke)', borderRadius:'var(--r-md)', fontSize:12.5, color:'var(--stone)', textAlign:'center' }}>No questions yet — add some above</div>}
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!delTarget} onClose={() => setDel(null)} title="Delete Campaign" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" loading={deleting} onClick={confirmDelete}>Delete</Button></>}>
        <p style={{ fontSize:14, color:'var(--slate)', lineHeight:1.6 }}>Are you sure you want to delete <strong>{delTarget?.name}</strong>? This cannot be undone.<br/><br/>Campaigns with submissions cannot be deleted.</p>
      </Modal>

      {/* Share link */}
      <Modal isOpen={!!shareTarget} onClose={() => setShare(null)} title="Share Campaign Link" size="sm">
        {shareTarget && (
          <div>
            <p style={{ fontSize:13.5, color:'var(--stone)', marginBottom:16 }}>Share this link to collect UGC for <strong>{shareTarget.name}</strong>.</p>
            <div style={{ display:'flex', gap:8 }}>
              <input className="form-input" readOnly value={`${window.location.origin}/submit/${shareTarget.slug}`} style={{ fontFamily:'monospace', fontSize:12.5 }}/>
              <Button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/submit/${shareTarget.slug}`); toast.success('Copied!') }}>Copy</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
