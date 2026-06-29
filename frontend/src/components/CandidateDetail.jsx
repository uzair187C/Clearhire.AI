import { useState } from 'react';

const API = import.meta.env.PROD
  ? 'https://clearhire-agent-491138345859.us-central1.run.app/api'
  : '/api';

export default function CandidateDetail({ candidate: c, onClose, onUpdate, showToast }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const updateStatus = async (status, note) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/uipath/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: c._id, status, note, by: 'hr_dashboard' })
      });
      if (res.ok) { showToast(`${c.name} → ${status.replace(/_/g, ' ')}`, 'success'); onUpdate(); }
    } catch { showToast('Failed to update', 'error'); }
    finally { setActionLoading(false); }
  };

  const sendNotification = async (template) => {
    try {
      const res = await fetch(`${API}/uipath/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: c._id, template })
      });
      const data = await res.json();
      showToast(data.success ? '✅ WhatsApp notification sent!' : 'Message logged (WhatsApp pending)', 'success');
    } catch { showToast('Notification failed', 'error'); }
  };

  const sendCustomMessage = async () => {
    if (!customMsg.trim()) return;
    try {
      const res = await fetch(`${API}/uipath/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: c._id, template: 'custom', customMessage: customMsg })
      });
      showToast('✅ Custom message sent!', 'success');
      setCustomMsg('');
      setShowCustom(false);
    } catch { showToast('Failed to send', 'error'); }
  };

  const sc = c.score?.overall >= 80 ? 'var(--green)' : c.score?.overall >= 60 ? 'var(--yellow)' : c.score?.overall > 0 ? 'var(--red)' : 'var(--text-muted)';
  const pct = c.score?.overall ? Math.round((c.score.overall / 100) * 283) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ marginBottom: '0.2rem' }}>{c.name || 'Processing...'}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.jobId?.title || 'Unknown Job'} · Applied {new Date(c.createdAt).toLocaleDateString()}</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Score Ring */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className="score-ring-wrap" style={{ padding: '0.5rem' }}>
            <div className="score-ring">
              <svg><circle className="track" cx="45" cy="45" r="45" /><circle className="fill" cx="45" cy="45" r="45" style={{ stroke: sc, strokeDashoffset: 283 - pct }} /></svg>
              <div className="score-ring-value" style={{ color: sc }}>{c.score?.overall || '—'}</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <span className={`score-badge ${c.score?.recommendation === 'shortlist' ? 'shortlist' : c.score?.recommendation === 'review' ? 'review' : c.score?.recommendation === 'reject' ? 'reject' : 'pending'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1.2rem', marginBottom: '0.5rem', display: 'inline-block' }}>
              {c.score?.recommendation?.toUpperCase() || 'PENDING'}
            </span>
            {c.score?.summary && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{c.score.summary}</p>}
          </div>
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
            <div className="detail-row"><span className="detail-key">Status</span><span className={`status-pill ${c.status}`}>{c.status?.replace(/_/g, ' ')}</span></div>
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

        {/* Timeline */}
        {c.statusHistory?.length > 0 && (
          <div className="detail-section">
            <h4>Timeline</h4>
            <div className="timeline">
              {c.statusHistory.map((h, i) => (
                <div key={i} className="timeline-item">
                  <div className="event">{h.status?.replace(/_/g, ' ')} {h.note && `— ${h.note}`}</div>
                  <div className="time">{new Date(h.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>Quick Actions</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {c.status !== 'shortlisted' && c.status !== 'selected' && (
              <button className="btn btn-success" onClick={() => updateStatus('shortlisted', 'Approved by HR')} disabled={actionLoading}>✅ Shortlist</button>
            )}
            {c.status !== 'rejected' && (
              <button className="btn btn-danger" onClick={() => updateStatus('rejected', 'Rejected by HR')} disabled={actionLoading}>❌ Reject</button>
            )}
            {c.status === 'shortlisted' && (
              <button className="btn btn-primary" onClick={() => updateStatus('interview_scheduled', 'Interview scheduled')} disabled={actionLoading}>📅 Schedule Interview</button>
            )}
            {c.status === 'interview_scheduled' && (
              <button className="btn btn-success" onClick={() => updateStatus('selected', 'Selected after interview')} disabled={actionLoading}>🎉 Select</button>
            )}
          </div>

          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>WhatsApp Notifications</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => sendNotification('shortlisted')}>📱 Send Shortlisted</button>
            <button className="btn btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => sendNotification('rejected')}>📱 Send Rejection</button>
            <button className="btn btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => sendNotification('underReview')}>📱 Send Under Review</button>
            <button className="btn btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => setShowCustom(!showCustom)}>✏️ Custom Message</button>
          </div>

          {showCustom && (
            <div style={{ marginBottom: '0.75rem' }}>
              <textarea className="form-textarea" placeholder={`Write a personalized message to ${c.name}...`} value={customMsg} onChange={e => setCustomMsg(e.target.value)} style={{ minHeight: '80px', marginBottom: '0.5rem' }} />
              <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={sendCustomMessage} disabled={!customMsg.trim()}>📱 Send Custom WhatsApp</button>
            </div>
          )}

          {c.email && (
            <>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>Email</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <a className="btn btn-secondary" style={{ fontSize: '0.78rem', textDecoration: 'none' }} href={`mailto:${c.email}?subject=Your Application for ${c.jobId?.title || 'the position'} - ClearHire&body=Dear ${c.name},%0D%0A%0D%0AThank you for your interest in the ${c.jobId?.title || 'position'} role.%0D%0A%0D%0AWe are pleased to inform you that after careful review of your application, you have been shortlisted for the next stage.%0D%0A%0D%0AOur team will be in touch shortly to schedule an interview.%0D%0A%0D%0ABest regards,%0D%0AClearHire HR Team`} target="_blank">
                  ✉️ Email Shortlisted
                </a>
                <a className="btn btn-secondary" style={{ fontSize: '0.78rem', textDecoration: 'none' }} href={`mailto:${c.email}?subject=Application Update - ${c.jobId?.title || 'Position'} - ClearHire&body=Dear ${c.name},%0D%0A%0D%0AThank you for applying to the ${c.jobId?.title || 'position'} role.%0D%0A%0D%0AAfter careful consideration, we have decided to move forward with other candidates at this time. We encourage you to apply for future openings.%0D%0A%0D%0ABest wishes,%0D%0AClearHire HR Team`} target="_blank">
                  ✉️ Email Rejection
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
