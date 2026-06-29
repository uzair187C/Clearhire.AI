import { useState, useEffect, useCallback } from 'react';
import JobForm from './components/JobForm.jsx';
import ApplyForm from './components/ApplyForm.jsx';
import CandidateDetail from './components/CandidateDetail.jsx';

const API = import.meta.env.PROD
  ? 'https://clearhire-agent-491138345859.us-central1.run.app/api'
  : '/api';

export default function App() {
  const [portal, setPortal] = useState('landing');
  const [hrAuth, setHrAuth] = useState(false);
  const [loginErr, setLoginErr] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [candidateProfile, setCandidateProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ch_profile')) || null; } catch { return null; }
  });

  const [view, setView] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg, type = 'info') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchData = useCallback(async () => {
    try {
      const [jr, cr] = await Promise.all([
        fetch(`${API}/jobs`).then(r => r.json()),
        fetch(`${API}/candidates`).then(r => r.json())
      ]);
      setJobs(Array.isArray(jr) ? jr : []);
      setCandidates(Array.isArray(cr) ? cr : []);
    } catch { showToast('Cannot reach backend', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const i = setInterval(fetchData, 6000); return () => clearInterval(i); }, [fetchData]);

  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter(c => ['shortlisted','selected','interview_scheduled'].includes(c.status)).length,
    review: candidates.filter(c => c.status === 'under_review').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
    scored: candidates.filter(c => c.score?.overall > 0).length,
    avgScore: (() => { const s = candidates.filter(c => c.score?.overall > 0); return s.length ? Math.round(s.reduce((a,c) => a + c.score.overall, 0) / s.length) : 0; })(),
  };

  const scoreColor = s => s >= 70 ? 'var(--green)' : s >= 50 ? 'var(--yellow)' : s > 0 ? 'var(--red)' : 'var(--text-muted)';
  const recClass = r => r === 'shortlist' ? 'shortlist' : r === 'review' ? 'review' : r === 'reject' ? 'reject' : 'pending';

  const handleHrLogin = e => {
    e.preventDefault();
    if (loginUser === 'ADMIN' && loginPass === '12345') { setHrAuth(true); setLoginErr(''); }
    else setLoginErr('Invalid credentials. Try ADMIN / 12345');
  };

  const saveCandidateProfile = (name, email, phone) => {
    const p = { name, email, phone };
    localStorage.setItem('ch_profile', JSON.stringify(p));
    setCandidateProfile(p);
  };

  const myApplications = candidateProfile
    ? candidates.filter(c => c.phone === candidateProfile.phone || c.email === candidateProfile.email || c.whatsappNumber === candidateProfile.phone)
    : [];

  // ═══════ LANDING PAGE ═══════
  if (portal === 'landing') {
    return (
      <div className="app">
        <header className="header">
          <div className="header-logo">
            <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#gl)"/><path d="M10 16l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="gl" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#6366f1"/></linearGradient></defs></svg>
            <h1>ClearHire</h1>
            <span>AI Powered</span>
          </div>
        </header>
        <main className="main" style={{ maxWidth: 800, textAlign: 'center', paddingTop: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎯</div>
          <div className="hero-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>AI-Powered <span>Recruitment</span></div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 2.5rem', fontSize: '0.95rem' }}>
            Screen candidates in seconds with Groq AI. Orchestrated by UiPath Maestro BPMN. Notifications via WhatsApp.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }} onClick={() => setPortal('hr')}>
              🔑 HR Dashboard
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }} onClick={() => setPortal('candidate')}>
              👤 Apply as Candidate
            </button>
          </div>
          <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: '🤖', label: 'Groq Llama 3.1', sub: 'AI Scoring' },
              { icon: '⚡', label: 'UiPath Maestro', sub: 'BPMN Orchestration' },
              { icon: '📱', label: 'WhatsApp', sub: 'Notifications' },
              { icon: '🗄️', label: 'MongoDB Atlas', sub: 'Database' },
            ].map((t, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>{t.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.sub}</div>
              </div>
            ))}
          </div>
        </main>
        {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
      </div>
    );
  }

  // ═══════ HR LOGIN GATE ═══════
  if (portal === 'hr' && !hrAuth) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-logo">
            <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#gl2)"/><path d="M10 16l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="gl2" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#6366f1"/></linearGradient></defs></svg>
            <h1>ClearHire</h1><span>HR Login</span>
          </div>
          <button className="nav-btn" onClick={() => setPortal('landing')}>← Back</button>
        </header>
        <main className="main" style={{ maxWidth: 420, paddingTop: '3rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>HR Dashboard Login</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Authorized personnel only</p>
            </div>
            <form onSubmit={handleHrLogin}>
              <div className="form-group">
                <label>Username</label>
                <input className="form-input" placeholder="Enter username" value={loginUser} onChange={e => setLoginUser(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input className="form-input" type="password" placeholder="Enter password" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
              </div>
              {loginErr && <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginBottom: '1rem' }}>{loginErr}</p>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign In</button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ═══════ CANDIDATE PORTAL ═══════
  if (portal === 'candidate') {
    const hasProfile = !!candidateProfile;
    return (
      <div className="app">
        <header className="header">
          <div className="header-logo">
            <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#gc)"/><path d="M10 16l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="gc" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#6366f1"/></linearGradient></defs></svg>
            <h1>ClearHire</h1><span>Candidate Portal</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {hasProfile && <span style={{ fontSize: '0.8rem', color: 'var(--accent-light)' }}>👤 {candidateProfile.name}</span>}
            <button className="nav-btn" onClick={() => setPortal('landing')}>← Back</button>
          </div>
        </header>
        <main className="main" style={{ maxWidth: 750 }}>
          {/* Save Profile */}
          {!hasProfile ? (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>👤 Create Your Profile</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Save your info for quick applications. Your profile is stored locally on this device.</p>
              <form onSubmit={e => { e.preventDefault(); const f = new FormData(e.target); saveCandidateProfile(f.get('n'), f.get('e'), f.get('p')); showToast('Profile saved!', 'success'); }}>
                <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                  <input name="n" className="form-input" placeholder="Full Name *" required />
                  <input name="e" className="form-input" placeholder="Email *" required />
                </div>
                <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                  <input name="p" className="form-input" placeholder="WhatsApp Number (e.g. +923...)" required />
                  <button type="submit" className="btn btn-primary">Save Profile</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{candidateProfile.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{candidateProfile.email} · {candidateProfile.phone}</div>
              </div>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => { localStorage.removeItem('ch_profile'); setCandidateProfile(null); }}>Edit Profile</button>
            </div>
          )}

          {/* My Applications */}
          {myApplications.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>📋 My Applications ({myApplications.length})</h3>
              <div className="candidates-grid">
                {myApplications.map(c => (
                  <div key={c._id} className="candidate-row" style={{ cursor: 'default' }}>
                    <div className="candidate-info">
                      <h3>{c.jobId?.title || 'Unknown Job'}</h3>
                      <p>Applied {new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="candidate-score">
                      <div className="number" style={{ color: scoreColor(c.score?.overall) }}>{c.score?.overall || '⏳'}</div>
                    </div>
                    <span className={`status-pill ${c.status}`}>{c.status?.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Open Jobs */}
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>💼 Open Positions</h3>
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : jobs.filter(j => j.status === 'active').length === 0 ? (
            <div className="empty-state"><div className="icon">💼</div><h3>No open positions</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {jobs.filter(j => j.status === 'active').map(j => (
                <div key={j._id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{j.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{j.company}</div>
                      {j.requirements?.skills?.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          {j.requirements.skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowApplyForm(true)}>Apply →</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.5rem' }}>📱</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem', fontSize: '0.9rem' }}>Stay Updated</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  After applying, you'll receive real-time updates via <strong>WhatsApp</strong> about your application status — scoring, shortlisting, and interview invitations. Make sure to provide a valid WhatsApp number!
                </div>
              </div>
            </div>
          </div>
        </main>

        {showApplyForm && <ApplyForm jobs={jobs} profile={candidateProfile} onClose={() => setShowApplyForm(false)} onApplied={() => { setShowApplyForm(false); fetchData(); showToast('✅ Application submitted! You\'ll receive a WhatsApp update shortly.', 'success'); }} />}
        {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
      </div>
    );
  }

  // ═══════ HR DASHBOARD ═══════
  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#gh)"/><path d="M10 16l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="gh" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#6366f1"/></linearGradient></defs></svg>
          <h1>ClearHire</h1><span>HR Dashboard</span>
        </div>
        <nav className="header-nav">
          <button className={`nav-btn ${view==='dashboard'?'active':''}`} onClick={()=>setView('dashboard')}>Dashboard</button>
          <button className={`nav-btn ${view==='jobs'?'active':''}`} onClick={()=>setView('jobs')}>Jobs</button>
          <button className={`nav-btn ${view==='pipeline'?'active':''}`} onClick={()=>setView('pipeline')}>Pipeline</button>
          <button className="nav-btn" onClick={()=>{setHrAuth(false);setPortal('landing');}}>Logout ↗</button>
        </nav>
      </header>

      <main className="main">
        <div className="hero-banner">
          <div>
            <div className="hero-title">AI Recruitment <span>Orchestration</span></div>
            <div className="hero-subtitle">UiPath Maestro BPMN · Groq Llama 3.1 · MongoDB Atlas · WhatsApp</div>
          </div>
          <div className="hero-badges">
            <span className="hero-badge uipath">⚡ UiPath Maestro</span>
            <span className="hero-badge ai">🤖 Groq AI</span>
            <span className="hero-badge live">Live</span>
          </div>
        </div>

        <div className="stats-bar">
          <div className="stat-card accent-glow"><div className="stat-label">Total Candidates</div><div className="stat-value accent">{stats.total}</div></div>
          <div className="stat-card green-glow"><div className="stat-label">Shortlisted</div><div className="stat-value green">{stats.shortlisted}</div></div>
          <div className="stat-card"><div className="stat-label">Under Review</div><div className="stat-value yellow">{stats.review}</div></div>
          <div className="stat-card"><div className="stat-label">Avg AI Score</div><div className="stat-value" style={{color:scoreColor(stats.avgScore)}}>{stats.avgScore||'—'}</div></div>
        </div>

        {view === 'dashboard' && (<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
            <h2 style={{fontSize:'1.1rem',fontWeight:700}}>Candidates</h2>
            <button className="btn btn-primary" style={{fontSize:'0.8rem'}} onClick={()=>setShowJobForm(true)}>+ New Job</button>
          </div>

          {/* Filter Tabs */}
          {candidates.length > 0 && (
            <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
              {[
                {key:'all',label:`All (${candidates.length})`},
                {key:'shortlisted',label:`✅ Shortlisted (${candidates.filter(c=>['shortlisted','selected','interview_scheduled'].includes(c.status)).length})`},
                {key:'under_review',label:`⏳ Review (${candidates.filter(c=>c.status==='under_review').length})`},
                {key:'rejected',label:`❌ Rejected (${candidates.filter(c=>c.status==='rejected').length})`},
                {key:'top',label:'🏆 Top Scores'},
              ].map(tab=>(
                <button key={tab.key}
                  className={`nav-btn ${(window._candFilter||'all')===tab.key?'active':''}`}
                  style={{fontSize:'0.78rem',padding:'0.35rem 0.75rem'}}
                  onClick={()=>{window._candFilter=tab.key;setView('dashboard');}}
                >{tab.label}</button>
              ))}
            </div>
          )}

          {loading ? <div className="loading-overlay"><div className="spinner"/><p>Loading...</p></div>
          : candidates.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><h3>No candidates yet</h3><p>Create a job and share the Candidate Portal.</p><button className="btn btn-primary" style={{marginTop:'1rem'}} onClick={()=>setShowJobForm(true)}>Create Job</button></div>
          ) : (
            <div className="candidates-grid">
              {(() => {
                const filter = window._candFilter || 'all';
                let filtered = [...candidates];
                if (filter === 'shortlisted') filtered = filtered.filter(c=>['shortlisted','selected','interview_scheduled'].includes(c.status));
                else if (filter === 'under_review') filtered = filtered.filter(c=>c.status==='under_review');
                else if (filter === 'rejected') filtered = filtered.filter(c=>c.status==='rejected');
                else if (filter === 'top') filtered = filtered.filter(c=>c.score?.overall>0).sort((a,b)=>(b.score?.overall||0)-(a.score?.overall||0));

                if (filtered.length === 0) return <div className="empty-state"><p style={{color:'var(--text-muted)'}}>No candidates in this category</p></div>;

                return filtered.map(c => (
                  <div key={c._id} className="candidate-row" onClick={()=>setSelectedCandidate(c)}>
                    <div className="candidate-info"><h3>{c.name||'Processing...'}</h3><p>{c.jobId?.title||'Unknown'} · {new Date(c.createdAt).toLocaleDateString()}</p></div>
                    <div className="candidate-score"><div className="number" style={{color:scoreColor(c.score?.overall)}}>{c.score?.overall||'—'}</div></div>
                    <span className={`score-badge ${recClass(c.score?.recommendation)}`}>{c.score?.recommendation||'pending'}</span>
                    <span className={`status-pill ${c.status}`}>{c.status?.replace(/_/g,' ')}</span>
                  </div>
                ));
              })()}
            </div>
          )}
        </>)}

        {view === 'jobs' && (<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
            <h2 style={{fontSize:'1.1rem',fontWeight:700}}>Job Postings</h2>
            <button className="btn btn-primary" onClick={()=>setShowJobForm(true)}>+ New Job</button>
          </div>
          {jobs.length===0 ? <div className="empty-state"><div className="icon">💼</div><h3>No jobs yet</h3></div> : (
            <div className="candidates-grid">{jobs.map(j=>(
              <div key={j._id} className="card">
                <div className="card-header"><div><div className="card-title">{j.title}</div><p style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{j.company}</p></div><span className={`status-pill ${j.status==='active'?'shortlisted':'rejected'}`}>{j.status}</span></div>
                <p style={{fontSize:'0.85rem',color:'var(--text-secondary)',marginBottom:'0.75rem'}}>{j.description}</p>
                <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>{j.requirements?.skills?.map((s,i)=><span key={i} className="skill-tag">{s}</span>)}</div>
              </div>
            ))}</div>
          )}
        </>)}

        {view === 'pipeline' && (<>
          <h2 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:'1rem'}}>UiPath Maestro Pipeline</h2>
          <div className="card" style={{marginBottom:'1.5rem',padding:'1.5rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:0,minWidth:'500px'}}>
              {[{l:'CV Received',c:stats.total,co:'var(--blue)',i:'📄'},{l:'AI Scored',c:stats.scored,co:'var(--accent)',i:'🤖'},{l:'Shortlisted',c:stats.shortlisted,co:'var(--green)',i:'✅'},{l:'Rejected',c:stats.rejected,co:'var(--red)',i:'❌'}].map((s,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',flex:1}}>
                  <div style={{flex:1,textAlign:'center'}}><div style={{fontSize:'1.5rem'}}>{s.i}</div><div style={{fontSize:'1.5rem',fontWeight:800,color:s.co}}>{s.c}</div><div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{s.l}</div></div>
                  {i<3&&<div style={{fontSize:'1.5rem',color:'var(--border)'}}>→</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{background:'rgba(255,102,0,0.04)',borderColor:'rgba(255,102,0,0.15)',marginBottom:'1rem'}}>
            <div style={{fontWeight:700,marginBottom:'0.75rem',color:'#ff8c42'}}>⚡ BPMN Flow</div>
            <div style={{fontFamily:'monospace',fontSize:'0.82rem',color:'var(--text-secondary)',lineHeight:2}}>
              <div>Start → <strong style={{color:'var(--accent-light)'}}>ScoreCandidate_API</strong> → [Groq AI 0-100]</div>
              <div style={{paddingLeft:'1rem'}}>↳ Gateway: <strong>score ≥ 70?</strong></div>
              <div style={{paddingLeft:'2rem',color:'var(--green)'}}>YES → UpdateStatus(shortlisted) → NotifyCandidate(SHORTLISTED) → End ✅</div>
              <div style={{paddingLeft:'2rem',color:'var(--red)'}}>NO → UpdateStatus(rejected) → NotifyCandidate(REJECTED) → End ❌</div>
            </div>
          </div>
          <div className="candidates-grid">{candidates.map(c=>(
            <div key={c._id} className="candidate-row" onClick={()=>setSelectedCandidate(c)}>
              <div className="candidate-info"><h3>{c.name||'...'}</h3><p>{c.jobId?.title||''}</p></div>
              <div className="candidate-score"><div className="number" style={{color:scoreColor(c.score?.overall)}}>{c.score?.overall||'—'}</div></div>
              <span className={`score-badge ${recClass(c.score?.recommendation)}`}>{c.score?.recommendation||'pending'}</span>
              <span className={`status-pill ${c.status}`}>{c.status?.replace(/_/g,' ')}</span>
            </div>
          ))}</div>
        </>)}
      </main>

      {showJobForm && <JobForm onClose={()=>setShowJobForm(false)} onCreated={j=>{setJobs(p=>[j,...p]);setShowJobForm(false);showToast(`Job "${j.title}" created!`,'success');}} />}
      {showApplyForm && <ApplyForm jobs={jobs} onClose={()=>setShowApplyForm(false)} onApplied={()=>{setShowApplyForm(false);fetchData();showToast('CV submitted!','success');}} />}
      {selectedCandidate && <CandidateDetail candidate={selectedCandidate} onClose={()=>setSelectedCandidate(null)} onUpdate={()=>{fetchData();setSelectedCandidate(null);}} showToast={showToast} />}
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
