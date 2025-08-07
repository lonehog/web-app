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
    // Merge by hourLabel while preserving order (descending by time as delivered)
    const map = new Map(prev.map(g => [g.hourLabel, { ...g }]));
    for (const g of next) {
      if (map.has(g.hourLabel)) {
        const merged = map.get(g.hourLabel);
        merged.jobs = [...merged.jobs, ...g.jobs];
        map.set(g.hourLabel, merged);
      } else {
        map.set(g.hourLabel, g);
      }
    }
    // Preserve the order: prev order then any new groups appended
    const existingLabels = prev.map(g => g.hourLabel);
    const newOnes = next.filter(g => !existingLabels.includes(g.hourLabel));
    return [...prev.map(l => map.get(l.hourLabel)), ...newOnes];
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
              <div key={j.id} className={`job ${j.is_repeat ? 'repeat' : ''}`}>
                <div className="title">{j.title}</div>
                <div className="small">{j.company || 'Unknown company'} — {j.location || 'Unknown location'} — {j.portal}</div>
                <div className="meta">
                  Posting: {formatISOToLabel(j.posting_time)} | Scraped: {formatISOToLabel(j.scrape_time)}
                  {j.is_repeat ? ' • Repeat' : ''}
                </div>
                {j.description_snippet && <div className="small" style={{ marginTop: 4 }}>{j.description_snippet}</div>}
              </div>
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
