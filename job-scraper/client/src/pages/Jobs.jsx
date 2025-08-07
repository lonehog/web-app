import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import { api } from '../api';

const ZONE = 'Europe/Berlin';

export default function Jobs() {
  const [filters, setFilters] = useState({ period: 'today', keyword: '', location: '' });
  const [available, setAvailable] = useState({ keywords: [], locations: [] });
  const [groups, setGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const sentinel = useRef(null);

  useEffect(() => {
    let mounted = true;
    api.getJobsFilters()
      .then(data => { if (mounted) setAvailable(data); })
      .catch(e => setErr(e?.response?.data?.error || 'Failed to load filters'));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // Reset when filters or period changes
    setGroups([]);
    setPage(1);
    setDone(false);
  }, [filters.period, filters.keyword, filters.location]);

  useEffect(() => {
    // Load data when page changes
    loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.period, filters.keyword, filters.location]);

  useEffect(() => {
    // Infinite scroll observer
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !done) {
        setPage((p) => p + 1);
      }
    }, { rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, done, sentinel.current]);

  async function loadPage(p) {
    if (loading || done) return;
    setLoading(true);
    setErr('');
    try {
      const data = await api.getJobs({
        period: filters.period,
        keyword: filters.keyword || undefined,
        location: filters.location || undefined,
        page: p,
        pageSize
      });
      if (!data.groups || data.groups.length === 0) {
        setDone(true);
      } else {
        setGroups((g) => mergeGroups(g, data.groups));
      }
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  function mergeGroups(prev, next) {
    // Merge by hourLabel while preserving order and avoiding duplicate job IDs
    const seen = new Set();
    prev.forEach(g => g.jobs.forEach(j => seen.add(j.id)));
    const all = [...prev.map(g => ({ ...g, jobs: [...g.jobs] }))];
    for (const g of next) {
      const fresh = g.jobs.filter(j => !seen.has(j.id));
      fresh.forEach(j => seen.add(j.id));
      const existing = all.find(x => x.hourLabel === g.hourLabel);
      if (existing) existing.jobs = [...existing.jobs, ...fresh];
      else all.push({ hourLabel: g.hourLabel, jobs: fresh });
    }
    return all;
  }

  function formatISOToLabel(iso) {
    const dt = DateTime.fromISO(iso, { zone: ZONE });
    return dt.toFormat('yyyy-LL-dd HH:mm');
  }

  return (
    <div>
      <h2>Jobs</h2>

      <div className="controls">
        <select
          value={filters.period}
          onChange={e => setFilters({ ...filters, period: e.target.value })}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>

        <select
          value={filters.keyword}
          onChange={e => setFilters({ ...filters, keyword: e.target.value })}
        >
          <option value="">All keywords</option>
          {(available.keywords || []).map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        <select
          value={filters.location}
          onChange={e => setFilters({ ...filters, location: e.target.value })}
        >
          <option value="">All locations</option>
          {(available.locations || []).map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {err && <div className="small" style={{ color: '#f87171', marginBottom: 8 }}>{err}</div>}

      <div>
        {groups.map(g => (
          <section key={g.hourLabel} className="job-group">
            <h3>{g.hourLabel}</h3>
            {g.jobs.map(j => (
              <a key={j.id} href={j.url || '#'} target="_blank" rel="noopener" className="job-card">
                <div className="job-header">
                  <div className="title">{j.title}</div>
                  <span className="badge portal">{j.portal}</span>
                </div>
                <div className="company">{j.company || 'Unknown company'} — {j.location || 'Unknown location'}</div>
                {j.description_snippet && <div className="snippet">{j.description_snippet}</div>}
                <div className="meta">
                  Posting: {formatISOToLabel(j.posting_time)} | Scraped: {formatISOToLabel(j.scrape_time)}
                </div>
              </a>
            ))}
          </section>
        ))}
      </div>

      {!done && (
        <div ref={sentinel} className="center" style={{ padding: 12 }}>
          {loading ? 'Loading…' : 'Scroll to load more'}
        </div>
      )}
      {done && groups.length === 0 && <div className="center">No jobs found for selected period/filters.</div>}
    </div>
  );
}
