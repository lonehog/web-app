import React, { useEffect, useState } from 'react';
import { api } from '../api';
import KeywordInput from '../components/KeywordInput.jsx';

export default function Portals() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ id: null, provider: 'LinkedIn', location: '', keywords: [] });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api.getPortals();
      setList(data);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load portals');
    }
  }

  useEffect(() => { load(); }, []);

  function edit(p) {
    setForm({
      id: p.id,
      provider: p.provider,
      location: p.location,
      keywords: (p.keywords || []).map(k => k.term)
    });
  }

  function reset() {
    setForm({ id: null, provider: 'LinkedIn', location: '', keywords: [] });
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const payload = {
        id: form.id,
        provider: form.provider,
        location: form.location,
        keywords: form.keywords
      };
      await api.savePortal(payload);
      reset();
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to save portal');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this portal and its keywords?')) return;
    try {
      await api.deletePortal(id);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to delete portal');
    }
  }

  return (
    <div>
      <h2>Search Portals</h2>

      <form className="form" onSubmit={submit}>
        <div className="row">
          <div className="field">
            <label>Provider</label>
            <select
              value={form.provider}
              onChange={e => setForm({ ...form, provider: e.target.value })}
            >
              <option value="LinkedIn">LinkedIn</option>
              <option value="Glassdoor">Glassdoor</option>
              <option value="Stepstone">Stepstone</option>
            </select>
          </div>
          <div className="field">
            <label>Location (country or city)</label>
            <input
              placeholder="e.g. Germany"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label>Keywords</label>
          <KeywordInput
            value={form.keywords}
            onChange={(k) => setForm({ ...form, keywords: k })}
          />
        </div>

        {err && <div className="small" style={{ color: '#f87171' }}>{err}</div>}

        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" type="submit" disabled={saving}>
            {form.id ? (saving ? 'Updating…' : 'Update') : (saving ? 'Saving…' : 'Save')}
          </button>
          {form.id && (
            <button type="button" className="btn secondary" onClick={reset}>Cancel</button>
          )}
        </div>
      </form>

      <div className="list" style={{ marginTop: 16 }}>
        {(list || []).length === 0 && <div className="small">No portals configured yet.</div>}
        {(list || []).map(p => (
          <div key={p.id} className="list-item">
            <div>
              <div><strong>{p.provider}</strong> — {p.location}</div>
              <div className="small">
                {(p.keywords || []).map(k => k.term).join(', ') || 'No keywords'}
              </div>
            </div>
            <div className="row">
              <button className="btn secondary" onClick={() => edit(p)}>Edit</button>
              <button className="btn danger" onClick={() => remove(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
