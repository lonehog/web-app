import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await api.signup(form.username, form.password);
      nav('/');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2>Create Admin User</h2>
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label>Username</label>
          <input
            autoFocus
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder="username"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="password"
          />
        </div>
        {err && <div className="small" style={{ color: '#f87171' }}>{err}</div>}
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create'}
          </button>
          <Link to="/login" className="btn secondary">Go to Login</Link>
        </div>
      </form>
      <p className="small">Note: Signup only allowed when no user exists.</p>
    </div>
  );
}
