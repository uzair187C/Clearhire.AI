import { useState } from 'react';

const API = '/api';

export default function JobForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', company: '', description: '',
    skills: '', minExperience: '', maxBudget: '', location: '', additionalNotes: ''
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          company: form.company || 'ClearHire Demo Co.',
          description: form.description,
          requirements: {
            skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
            minExperience: parseInt(form.minExperience) || 0,
            maxBudget: form.maxBudget,
            location: form.location,
            additionalNotes: form.additionalNotes
          }
        })
      });
      const job = await res.json();
      if (res.ok) onCreated(job);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Job Posting</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Job Title *</label>
            <input className="form-input" placeholder="e.g. Node.js Developer" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Company</label>
              <input className="form-input" placeholder="Company name" value={form.company} onChange={e => set('company', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input className="form-input" placeholder="e.g. Remote (Pakistan)" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-textarea" placeholder="Job description..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Required Skills (comma-separated)</label>
            <input className="form-input" placeholder="Node.js, Express, MongoDB, React" value={form.skills} onChange={e => set('skills', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Min Experience (years)</label>
              <input className="form-input" type="number" min="0" placeholder="3" value={form.minExperience} onChange={e => set('minExperience', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Budget</label>
              <input className="form-input" placeholder="$2000/month" value={form.maxBudget} onChange={e => set('maxBudget', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Additional Notes</label>
            <textarea className="form-textarea" placeholder="Any extra requirements..." value={form.additionalNotes} onChange={e => set('additionalNotes', e.target.value)} style={{ minHeight: '60px' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" /> Creating...</> : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
