import { useState, useEffect, useCallback } from 'react';
import JobForm from './components/JobForm.jsx';
import ApplyForm from './components/ApplyForm.jsx';
import CandidateDetail from './components/CandidateDetail.jsx';

const API = '/api';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [jobsRes, candRes] = await Promise.all([
        fetch(`${API}/jobs`).then(r => r.json()),
        fetch(`${API}/candidates`).then(r => r.json())
      ]);
      setJobs(jobsRes);
      setCandidates(candRes);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 5s to catch async scoring updates
  useEffect(() => {
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted' || c.status === 'selected').length,
    review: candidates.filter(c => c.status === 'under_review').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
  };

  const getScoreClass = (rec) => {
    if (rec === 'shortlist') return 'shortlist';
    if (rec === 'review') return 'review';
    if (rec === 'reject') return 'reject';
    return 'pending';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--green)';
    if (score >= 60) return 'var(--yellow)';
    if (score > 0) return 'var(--red)';
    return 'var(--text-muted)';
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <svg viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#g)" />
            <path d="M10 16l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs><linearGradient id="g" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#818cf8" /><stop offset="1" stopColor="#6366f1" /></linearGradient></defs>
          </svg>
          <h1>ClearHire</h1>
          <span>AI Powered</span>
        </div>
        <nav className="header-nav">
          <button className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={`nav-btn ${view === 'jobs' ? 'active' : ''}`} onClick={() => setView('jobs')}>Jobs</button>
          <button className="btn btn-primary" onClick={() => setShowApplyForm(true)}>+ Apply</button>
        </nav>
      </header>

      <main className="main">
        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-label">Total Candidates</div>
            <div className="stat-value accent">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Shortlisted</div>
            <div className="stat-value green">{stats.shortlisted}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Under Review</div>
            <div className="stat-value yellow">{stats.review}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rejected</div>
            <div className="stat-value red">{stats.rejected}</div>
          </div>
        </div>

        {/* Dashboard / Candidates */}
        {view === 'dashboard' && (
          <>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Candidates</h2>
            </div>
            {loading ? (
              <div className="loading-overlay"><div className="spinner" /><p>Loading candidates...</p></div>
            ) : candidates.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📋</div>
                <h3>No candidates yet</h3>
                <p>Create a job posting and start receiving applications.</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowJobForm(true)}>Create Job</button>
              </div>
            ) : (
              <div className="candidates-grid">
                {candidates.map(c => (
                  <div key={c._id} className="candidate-row" onClick={() => setSelectedCandidate(c)}>
                    <div className="candidate-info">
                      <h3>{c.name || 'Processing...'}</h3>
                      <p>{c.jobId?.title || 'Unknown Job'} · {new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="candidate-score">
                      <div className="number" style={{ color: getScoreColor(c.score?.overall) }}>{c.score?.overall || '—'}</div>
                    </div>
                    <span className={`score-badge ${getScoreClass(c.score?.recommendation)}`}>
                      {c.score?.recommendation || 'pending'}
                    </span>
                    <span className={`status-pill ${c.status}`}>
                      {c.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Jobs View */}
        {view === 'jobs' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Job Postings</h2>
              <button className="btn btn-primary" onClick={() => setShowJobForm(true)}>+ New Job</button>
            </div>
            {jobs.length === 0 ? (
              <div className="empty-state">
                <div className="icon">💼</div>
                <h3>No jobs yet</h3>
                <p>Create your first job posting to start receiving applications.</p>
              </div>
            ) : (
              <div className="candidates-grid">
                {jobs.map(j => (
                  <div key={j._id} className="card">
                    <div className="card-header">
                      <div>
                        <div className="card-title">{j.title}</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{j.company}</p>
                      </div>
                      <span className={`status-pill ${j.status === 'active' ? 'shortlisted' : 'rejected'}`}>{j.status}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{j.description}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {j.requirements?.skills?.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>📍 {j.requirements?.location || 'Any'}</span>
                      <span>💰 {j.requirements?.maxBudget || 'N/A'}</span>
                      <span>⏳ {j.requirements?.minExperience || 0}+ yrs</span>
                      <span>👥 {j.candidateCount || 0} applicants</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showJobForm && (
        <JobForm
          onClose={() => setShowJobForm(false)}
          onCreated={(job) => { setJobs(prev => [job, ...prev]); setShowJobForm(false); showToast(`Job "${job.title}" created!`, 'success'); }}
        />
      )}

      {showApplyForm && (
        <ApplyForm
          jobs={jobs}
          onClose={() => setShowApplyForm(false)}
          onApplied={() => { setShowApplyForm(false); fetchData(); showToast('CV submitted! Processing started.', 'success'); }}
        />
      )}

      {selectedCandidate && (
        <CandidateDetail
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onUpdate={() => { fetchData(); setSelectedCandidate(null); }}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
