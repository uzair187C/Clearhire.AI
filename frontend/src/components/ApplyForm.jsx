import { useState } from 'react';

const API = '/api';

export default function ApplyForm({ jobs, onClose, onApplied }) {
  const [jobId, setJobId] = useState(jobs[0]?._id || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (f && (f.type === 'application/pdf' || f.name.endsWith('.pdf') || f.name.endsWith('.txt'))) {
      setFile(f);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!jobId || !file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('cv', file);
      fd.append('jobId', jobId);
      if (whatsapp) fd.append('whatsappNumber', whatsapp);
      const res = await fetch(`${API}/candidates/apply`, { method: 'POST', body: fd });
      if (res.ok) onApplied();
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
          <h2>Submit Application</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Select Job *</label>
            {jobs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No jobs available. Create one first.</p>
            ) : (
              <select className="form-input form-select" value={jobId} onChange={e => setJobId(e.target.value)}>
                {jobs.filter(j => j.status === 'active').map(j => (
                  <option key={j._id} value={j._id}>{j.title} — {j.company}</option>
                ))}
              </select>
            )}
          </div>
          <div className="form-group">
            <label>Upload CV (PDF) *</label>
            <div
              className={`file-upload ${dragOver ? 'dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            >
              <input type="file" accept=".pdf,.txt" onChange={e => handleFile(e.target.files[0])} />
              <div className="icon">📄</div>
              <p>Drag & drop your CV here, or click to browse</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF or TXT, max 10MB</p>
              {file && <div className="filename">✅ {file.name}</div>}
            </div>
          </div>
          <div className="form-group">
            <label>WhatsApp Number (optional — for notifications)</label>
            <input className="form-input" placeholder="+923001234567" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !file || !jobId}>
              {loading ? <><div className="spinner" /> Submitting...</> : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
