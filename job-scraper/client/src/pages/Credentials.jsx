import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Credentials() {
  const [provider, setProvider] = useState('LinkedIn');
  const [form, setForm] = useState({
    LINKEDIN_LI_AT: '',
    LINKEDIN_JSESSIONID: '',
    LINKEDIN_LIAP: '',
    LINKEDIN_LIDC: '',
    LINKEDIN_BCOOKIE: '',
    LINKEDIN_BSCOOKIE: '',
    recencyHours: 24
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showValues, setShowValues] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load(includeSecrets = false) {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch(`/api/credentials/${encodeURIComponent(provider)}?includeSecrets=${includeSecrets ? 'true' : 'false'}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to load credentials');
      const data = await res.json();
      setLastUpdated(data.updated_at || null);
      if (includeSecrets && data.data) {
        setForm({
          LINKEDIN_LI_AT: data.data.LINKEDIN_LI_AT || '',
          LINKEDIN_JSESSIONID: data.data.LINKEDIN_JSESSIONID || '',
          LINKEDIN_LIAP: data.data.LINKEDIN_LIAP || '',
          LINKEDIN_LIDC: data.data.LINKEDIN_LIDC || '',
          LINKEDIN_BCOOKIE: data.data.LINKEDIN_BCOOKIE || '',
          LINKEDIN_BSCOOKIE: data.data.LINKEDIN_BSCOOKIE || '',
          recencyHours: (data.data.recencyHours === 1 ? 1 : 24)
        });
      }
    } catch (e) {
      setErr(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const body = {
        provider,
        data: {
          ...form,
          recencyHours: Number(form.recencyHours) === 1 ? 1 : 24
        }
      };
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to save credential');
      }
      const j = await res.json();
      setLastUpdated(j.updated_at);
    } catch (e) {
      setErr(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function onChangeField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  return (
    <div>
      <h2>Credentials</h2>
      <div className="form" style={{ marginBottom: 16 }}>
        <div className="row">
          <div className="field">
            <label>Provider</label>
            <select value={provider} onChange={e => setProvider(e.target.value)}>
              <option value="LinkedIn">LinkedIn</option>
              {/* future: add more providers here */}
            </select>
          </div>
          <div className="field">
            <label>Recency (LinkedIn)</label>
            <input value="Last hour (r3600)" disabled />
            <div className="small">Searches are forced to last hour only.</div>
          </div>
        </div>

        <div className="row" style={{ alignItems: 'center' }}>
          <label>
            <input
              type="checkbox"
              checked={showValues}
              onChange={async (e) => {
                const next = e.target.checked;
                setShowValues(next);
                await load(next);
              }}
            />{' '}
            Show stored values (reveals secrets)
          </label>
          {lastUpdated && <div className="small" style={{ marginLeft: 12 }}>Last updated: {lastUpdated}</div>}
        </div>

        <form onSubmit={submit}>
          <div className="row">
            <div className="field">
              <label>LINKEDIN_LI_AT</label>
              <input
                placeholder="li_at cookie"
                value={form.LINKEDIN_LI_AT}
                onChange={e => onChangeField('LINKEDIN_LI_AT', e.target.value)}
              />
            </div>
            <div className="field">
              <label>LINKEDIN_JSESSIONID</label>
              <input
                placeholder='JSESSIONID (without quotes, we will quote it)'
                value={form.LINKEDIN_JSESSIONID}
                onChange={e => onChangeField('LINKEDIN_JSESSIONID', e.target.value)}
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>LINKEDIN_LIAP</label>
              <input
                placeholder="liap cookie"
                value={form.LINKEDIN_LIAP}
                onChange={e => onChangeField('LINKEDIN_LIAP', e.target.value)}
              />
            </div>
            <div className="field">
              <label>LINKEDIN_LIDC</label>
              <input
                placeholder="lidc cookie"
                value={form.LINKEDIN_LIDC}
                onChange={e => onChangeField('LINKEDIN_LIDC', e.target.value)}
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>LINKEDIN_BCOOKIE</label>
              <input
                placeholder="bcookie"
                value={form.LINKEDIN_BCOOKIE}
                onChange={e => onChangeField('LINKEDIN_BCOOKIE', e.target.value)}
              />
            </div>
            <div className="field">
              <label>LINKEDIN_BSCOOKIE</label>
              <input
                placeholder="bscookie"
                value={form.LINKEDIN_BSCOOKIE}
                onChange={e => onChangeField('LINKEDIN_BSCOOKIE', e.target.value)}
              />
            </div>
          </div>

          {err && <div className="small" style={{ color: '#f87171' }}>{err}</div>}

          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div><strong>How to use</strong></div>
        <div className="small" style={{ marginTop: 6 }}>
          Paste your LinkedIn cookie values here. The scraper will use them in the Cookie header and apply the selected recency window (f_TPR).
        </div>
      </div>
    </div>
  );
}
