import React, { useEffect, useState } from 'react';
import { api } from '../api';
import TrendChart from '../components/TrendChart.jsx';

export default function Home() {
  const [metrics, setMetrics] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    api.getMetrics()
      .then(data => { if (mounted) setMetrics(data); })
      .catch(e => setErr(e?.response?.data?.error || 'Failed to load metrics'));
    return () => { mounted = false; };
  }, []);

  if (err) return <div className="center">{err}</div>;
  if (!metrics) return <div className="center">Loading…</div>;

  return (
    <div>
      <h2>Home</h2>
      <div className="card-grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div>Jobs in Last Hour</div>
          <div className="big-number">{metrics.jobs_last_hour}</div>
        </div>
        <div className="card">
          <div>Jobs Today</div>
          <div className="big-number">{metrics.jobs_today}</div>
        </div>
      </div>
      <TrendChart data={metrics.trend_last_7_days} />
    </div>
  );
}
