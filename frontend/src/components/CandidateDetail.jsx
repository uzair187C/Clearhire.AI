import { useState } from 'react';

const API = '/api';

export default function CandidateDetail({ candidate: c, onClose, onUpdate, showToast }) {
  const [actionLoading, setActionLoading] = useState(false);

  const updateStatus = async (status, note) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/uipath/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: c._id, status, note, by: 'hr_dashboard' })
      });
      if (res.ok) {
        showToast(`${c.name} → ${status.replace('_', ' ')}`, 'success');
        onUpdate();
      }
    } catch (err) {
      showToast('Failed to update', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const sendNotification = async (template) => {
    try {
      const res = await fetch(`${API}/uipath/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: c._id, template })
      });
      const data = await res.json();
      showToast(data.mock ? 'WhatsApp logged (mock mode)' : 'WhatsApp sent!', 'success');
    } catch {
      showToast('Notification failed', 'error');
    }
  };

  const scoreColor = c.score?.overall >= 80 ? 'var(--green)' : c.score?.overall >= 60 ? 'var(--yellow)' : c.score?.overall > 0 ? 'var(--red)' : 'var(--text-muted)';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <div>
            <h2>{c.name || 'Processing...'}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.jobId?.title || 'Unknown Job'}</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Score Section */}
        <div className="card" style={{ marginBottom: '1rem', textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: scoreColor }}>{c.score?.overall || '—'}</div>
          <span className={`score-badge ${c.score?.recommendation === 'shortlist' ? 'shortlist' : c.score?.recommendation === 'review' ? 'review' : c.score?.recommendation === 'reject' ? 'reject' : 'pending'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1.2rem' }}>
            {c.score?.recommendation?.toUpperCase() || 'PENDING'}
          </span>
          {c.score?.summary && <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.score.summary}</p>}
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="detail-section">
            <h4>Contact</h4>
            <div className="detail-row"><span className="detail-key">Email</span><span className="detail-val">{c.email || '—'}</span></div>
            <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-val">{c.phone || '—'}</span></div>
            <div className="detail-row"><span className="detail-key">WhatsApp</span><span className="detail-val">{c.whatsappNumber || '—'}</span></div>
          </div>
          <div className="detail-section">
            <h4>Profile</h4>
            <div className="detail-row"><span className="detail-key">Experience</span><span className="detail-val">{c.extracted?.experience || '—'} yrs</span></div>
            <div className="detail-row"><span className="detail-key">Education</span><span className="detail-val">{c.extracted?.education || '—'}</span></div>
            <div className="detail-row"><span className="detail-key">Status</span><span className={`status-pill ${c.status}`}>{c.status?.replace('_', ' ')}</span></div>
          </div>
        </div>

        {/* Skills */}
        {c.extracted?.skills?.length > 0 && (
          <div className="detail-section">
            <h4>Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {c.extracted.skills.map((s, i) => <span key={i} className="skill-tag" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}>{s}</span>)}
            </div>
          </div>
        )}

        {/* Strengths & Gaps */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {c.score?.strengths?.length > 0 && (
            <div className="detail-section">
              <h4>Strengths</h4>
              <ul className="strengths-list">{c.score.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {c.score?.gaps?.length > 0 && (
            <div className="detail-section">
              <h4>Gaps</h4>
              <ul className="gaps-list">{c.score.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </div>
          )}
        </div>

        {/* Status Timeline */}
        {c.statusHistory?.length > 0 && (
          <div className="detail-section">
            <h4>Timeline</h4>
            <div className="timeline">
              {c.statusHistory.map((h, i) => (
                <div key={i} className="timeline-item">
                  <div className="event">{h.status?.replace('_', ' ')} {h.note && `— ${h.note}`}</div>
                  <div className="time">{new Date(h.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          {c.status === 'under_review' && (
            <>
              <button className="btn btn-success" onClick={() => updateStatus('shortlisted', 'Approved by HR')} disabled={actionLoading}>✅ Approve</button>
              <button className="btn btn-danger" onClick={() => updateStatus('rejected', 'Rejected by HR')} disabled={actionLoading}>❌ Reject</button>
            </>
          )}
          {c.status === 'shortlisted' && (
            <button className="btn btn-primary" onClick={() => updateStatus('interview_scheduled', 'Interview scheduled')} disabled={actionLoading}>📅 Schedule Interview</button>
          )}
          {c.status === 'interview_scheduled' && (
            <>
              <button className="btn btn-success" onClick={() => updateStatus('selected', 'Selected after interview')} disabled={actionLoading}>🎉 Select</button>
              <button className="btn btn-danger" onClick={() => updateStatus('rejected', 'Rejected after interview')} disabled={actionLoading}>❌ Reject</button>
            </>
          )}
          <button className="btn btn-secondary" onClick={() => sendNotification(c.status === 'rejected' ? 'rejected' : c.status === 'selected' ? 'selected' : 'underReview')}>
            📱 Send WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
