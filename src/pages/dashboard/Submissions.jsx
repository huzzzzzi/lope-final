import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import Pill   from '../../components/ui/Pill'
import Modal  from '../../components/ui/Modal'
import s from './Submissions.module.css'

const SV = { pending:'amber', approved:'green', rejected:'red' }

export default function Submissions() {
  const toast = useToast()
  const [subs,    setSubs]   = useState([])
  const [loading, setLoad]   = useState(true)
  const [filter,  setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [acting,   setActing]   = useState(null)

  const load = useCallback(async () => {
    setLoad(true)
    try { setSubs(await api.get('/submissions' + (filter!=='all' ? `?status=${filter}` : ''))) }
    catch (e) { toast.error(e.message) }
    finally { setLoad(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function act(id, status) {
    setActing(id+status)
    try {
      await api.patch(`/submissions/${id}`, { status })
      toast.success(status === 'approved' ? 'Approved — story queued!' : 'Submission rejected')
      setSelected(null); load()
    } catch (e) { toast.error(e.message) }
    finally { setActing(null) }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div><h1 className="page-title">Submissions</h1><p className="page-sub">{subs.length} submissions</p></div>
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {['all','pending','approved','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={s.filterBtn+(filter===f?' '+s.filterActive:'')}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>
      {loading ? (
        <div className={s.grid}>{[0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:260, borderRadius:'var(--r-lg)' }}/>)}</div>
      ) : subs.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="icon">📸</div><h3>No submissions</h3><p>Submissions appear here once customers share via your campaign links.</p></div></div>
      ) : (
        <div className={s.grid}>
          {subs.map(sub => (
            <div key={sub.id} className={s.card} onClick={() => setSelected(sub)}>
              <div className={s.thumb}>
                <img src={sub.mediaUrl||sub.media_url} alt={sub.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                <div className={s.pill}><Pill variant={SV[sub.status]||'gray'} dot>{sub.status}</Pill></div>
                {sub.status === 'pending' && (
                  <div className={s.quickActions} onClick={e => e.stopPropagation()}>
                    <button className={`${s.qa} ${s.qaApprove}`} onClick={() => act(sub.id,'approved')} disabled={!!acting}>✓ Approve</button>
                    <button className={`${s.qa} ${s.qaReject}`}  onClick={() => act(sub.id,'rejected')} disabled={!!acting}>✕ Reject</button>
                  </div>
                )}
              </div>
              <div className={s.info}>
                <div className={s.infoName}>{sub.name}</div>
                <div className={s.infoCamp}>{sub.campaign?.name}</div>
                <div className={s.infoDate}>{new Date(sub.createdAt||sub.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'})}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Submission Detail" size="md">
        {selected && (
          <div>
            <div style={{ borderRadius:'var(--r-lg)', overflow:'hidden', marginBottom:20, background:'var(--smoke)', maxHeight:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img src={selected.mediaUrl||selected.media_url} alt="" style={{ width:'100%', maxHeight:300, objectFit:'contain' }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {[['Name',selected.name],['Contact',selected.contact],['Campaign',selected.campaign?.name],['Status',selected.status],['Submitted',new Date(selected.createdAt||selected.created_at).toLocaleDateString()]].map(([l,v]) => (
                <div key={l}><div style={{ fontSize:10.5, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--stone)', fontFamily:'var(--font-display)', marginBottom:3 }}>{l}</div><div style={{ fontSize:13.5, color:'var(--ink)', fontWeight:500 }}>{v||'—'}</div></div>
              ))}
            </div>
            {selected.message && <div style={{ padding:'12px 14px', background:'var(--smoke)', borderRadius:'var(--r-md)', fontSize:13.5, color:'var(--slate)', lineHeight:1.6, marginBottom:16, fontStyle:'italic' }}>"{selected.message}"</div>}
            {selected.status === 'pending' && (
              <div style={{ display:'flex', gap:10 }}>
                <Button fullWidth loading={acting===selected.id+'approved'} onClick={() => act(selected.id,'approved')}>✓ Approve</Button>
                <Button fullWidth variant="danger" loading={acting===selected.id+'rejected'} onClick={() => act(selected.id,'rejected')}>✕ Reject</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
