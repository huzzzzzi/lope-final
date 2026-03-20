import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import Pill from '../../components/ui/Pill'
import s from './Overview.module.css'

const SV = { pending:'amber', approved:'green', rejected:'red', processing:'blue', completed:'green', failed:'red', live:'green', ended:'gray', draft:'amber' }

function StatCard({ label, value, sub, color, icon, loading, to }) {
  if (loading) return <div className="skeleton" style={{ height:114, borderRadius:'var(--r-lg)' }}/>
  const inner = (
    <div className={s.statCard}>
      <div className={s.statIcon}>{icon}</div>
      <div className={s.statLabel}>{label}</div>
      <div className={s.statVal} style={{ color: color||'var(--ink)' }}>{value}</div>
      {sub && <div className={s.statSub}>{sub}</div>}
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration:'none' }}>{inner}</Link> : inner
}

const FEED = [
  { i:'MK', c:'#1c4a3b', t:'Maria K. submitted a photo to Summer Run', d:'Just now' },
  { i:'JR', c:'#2d4fa8', t:'Story generated for James R.',              d:'2m ago'   },
  { i:'AB', c:'#e8a838', t:'Anya B. uploaded to Win the Court',         d:'5m ago'   },
]

export default function Overview() {
  const toast = useToast()
  const [stats, setStats]   = useState(null)
  const [stories, setStories]     = useState([])
  const [submissions, setSubs]    = useState([])
  const [loading, setLoad]        = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/stats'),
      api.get('/stories?limit=4'),
      api.get('/submissions?status=pending'),
    ])
    .then(([st, str, subs]) => {
      setStats(st)
      setStories(Array.isArray(str) ? str : [])
      setSubs(Array.isArray(subs) ? subs : [])
    })
    .catch(e => toast.error(e.message))
    .finally(() => setLoad(false))
  }, [])

  const cards = stats ? [
    { label:'Total Submissions', value:stats.submissions.total, sub:`${stats.submissions.pending} pending`, icon:'📸', to:'/dashboard/submissions' },
    { label:'Stories Generated', value:stats.stories.completed, sub:`${stats.stories.processing} processing`, icon:'✦', color:'var(--forest)', to:'/dashboard/stories' },
    { label:'Active Campaigns',  value:stats.campaigns.active,  sub:`${stats.campaigns.draft} draft`, icon:'📣', color:'var(--forest)', to:'/dashboard/campaigns' },
    { label:'Pending Review',    value:stats.submissions.pending, sub:'Need your attention', icon:'⏳', color:stats.submissions.pending>0?'var(--amber)':undefined, to:'/dashboard/submissions' },
  ] : [null, null, null, null]

  return (
    <div className="fade-up">
      <div className="page-header">
        <div><h1 className="page-title">Overview</h1><p className="page-sub">Your UGC performance at a glance</p></div>
      </div>

      <div className={s.grid4}>{cards.map((c, i) => <StatCard key={i} {...(c||{})} loading={!c} />)}</div>

      <div className={s.grid2}>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div className="section-title" style={{ marginBottom:0 }}>Pending Submissions</div>
            <Link to="/dashboard/submissions" style={{ fontSize:12, color:'var(--forest)', fontWeight:600 }}>View all →</Link>
          </div>
          {loading ? <div className="skeleton" style={{ height:180, borderRadius:'var(--r-lg)' }}/> :
          submissions.length === 0 ? <div className="card" style={{ padding:'32px 20px', textAlign:'center', color:'var(--stone)', fontSize:13 }}>🎉 All caught up!</div> :
          <div className="card">
            {submissions.slice(0, 4).map((sub, i) => (
              <div key={sub.id} style={{ display:'flex', gap:12, padding:'12px 16px', borderBottom:i<3?'1px solid var(--mist)':'none', alignItems:'center' }}>
                <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', flexShrink:0, background:'var(--smoke)' }}>
                  <img src={sub.mediaUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:600, color:'var(--ink)' }}>{sub.name}</div>
                  <div style={{ fontSize:11.5, color:'var(--stone)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub.campaign?.name}</div>
                </div>
                <Pill variant={SV[sub.status]||'gray'} dot>{sub.status}</Pill>
              </div>
            ))}
          </div>}
        </div>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div className="section-title" style={{ marginBottom:0 }}>Recent Stories</div>
            <Link to="/dashboard/stories" style={{ fontSize:12, color:'var(--forest)', fontWeight:600 }}>View all →</Link>
          </div>
          {loading ? <div className="skeleton" style={{ height:180, borderRadius:'var(--r-lg)' }}/> :
          stories.length === 0 ? <div className="card" style={{ padding:'32px 20px', textAlign:'center', color:'var(--stone)', fontSize:13 }}>No stories yet — approve submissions to generate them.</div> :
          <div className={s.storiesGrid}>
            {stories.map((st, i) => (
              <div key={st.id} className="card" style={{ overflow:'hidden' }}>
                <div style={{ height:90, background:'linear-gradient(135deg,#1c4a3b,#2d6b57)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, position:'relative' }}>
                  {st.generatedMediaUrl ? <img src={st.generatedMediaUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }}/> : <span>{'✦🏃🏀🧘'[i%4]}</span>}
                  <div style={{ position:'absolute', top:6, right:6 }}><Pill variant={SV[st.status]||'gray'}>{st.status}</Pill></div>
                </div>
                <div style={{ padding:'10px 12px' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:12.5, fontWeight:700, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{st.campaignName}</div>
                </div>
              </div>
            ))}
          </div>}
        </div>
      </div>

      <div style={{ marginTop:24 }}>
        <div className="section-title">Live Activity</div>
        <div className="card">
          {FEED.map((a, i) => (
            <div key={i} style={{ display:'flex', gap:12, padding:'11px 18px', borderBottom:i<FEED.length-1?'1px solid var(--mist)':'none', alignItems:'center' }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:a.c, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{a.i}</div>
              <div><div style={{ fontSize:12.5, color:'var(--slate)' }}>{a.t}</div><div style={{ fontSize:11, color:'var(--stone)', marginTop:1 }}>{a.d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
