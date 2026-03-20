import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import Pill   from '../../components/ui/Pill'
import s from './Stories.module.css'

const SV   = { completed:'green', processing:'blue', failed:'red' }
const EMOJ = ['🏃','🏀','🧘','🎯','🌟','📸','🎨','✦']

export default function Stories() {
  const toast = useToast()
  const [stories, setS]    = useState([])
  const [loading, setL]    = useState(true)
  const [filter,  setF]    = useState('all')
  const [generating, setG] = useState(null)

  const load = useCallback(async () => {
    setL(true)
    try { setS(await api.get('/stories' + (filter !== 'all' ? `?status=${filter}` : ''))) }
    catch (e) { toast.error(e.message) }
    finally { setL(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function generate(st) {
    setG(st.id)
    try { toast.info('Generating story…'); await api.post(`/stories/${st.id}/generate`, {}); toast.success('Story generated!'); load() }
    catch (e) { toast.error(e.message) }
    finally { setG(null) }
  }

  return (
    <div className="fade-up">
      <div className="page-header"><div><h1 className="page-title">Stories</h1><p className="page-sub">{stories.length} stories</p></div></div>
      <div style={{ display:'flex', gap:6, marginBottom:22 }}>
        {['all','completed','processing','failed'].map(f => (
          <button key={f} onClick={() => setF(f)} className={s.filterBtn+(filter===f?' '+s.filterActive:'')}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>
      {loading ? (
        <div className={s.grid}>{[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height:280, borderRadius:'var(--r-lg)' }}/>)}</div>
      ) : stories.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="icon">✦</div><h3>No stories yet</h3><p>Approve submissions to generate UGC stories.</p></div></div>
      ) : (
        <div className={s.grid}>
          {stories.map((st, i) => (
            <div key={st.id} className="card">
              <div style={{ height:180, background:'linear-gradient(160deg,#1c4a3b,#2d6b57)', position:'relative', borderRadius:'var(--r-lg) var(--r-lg) 0 0', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {st.generatedMediaUrl ? <img src={st.generatedMediaUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:48, opacity:.6 }}>{EMOJ[i%EMOJ.length]}</span>}
                <div style={{ position:'absolute', top:10, left:10 }}><Pill variant={SV[st.status]||'gray'} dot>{st.status}</Pill></div>
                {st.status === 'processing' && <div style={{ position:'absolute', inset:0, background:'rgba(28,74,59,.5)', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:32, height:32, border:'3px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite' }}/></div>}
              </div>
              <div style={{ padding:'14px 16px' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:13.5, fontWeight:700, color:'var(--ink)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{st.campaignName||'Story #'+st.id}</div>
                <div style={{ fontSize:11.5, color:'var(--stone)', marginBottom:12 }}>{st.submissionName} · {new Date(st.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                <div style={{ display:'flex', gap:6 }}>
                  {st.status === 'processing' && <Button size="sm" fullWidth loading={generating===st.id} onClick={() => generate(st)}>Generate</Button>}
                  {st.status === 'completed'  && <><Button size="sm" variant="outline" onClick={() => window.open(st.generatedMediaUrl,'_blank')}>View</Button><Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(st.generatedMediaUrl||''); toast.success('URL copied!') }}>Copy</Button></>}
                  {st.status === 'failed'     && <Button size="sm" variant="danger" loading={generating===st.id} onClick={() => generate(st)}>Retry</Button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{'@keyframes spin { to { transform:rotate(360deg) } }'}</style>
    </div>
  )
}
