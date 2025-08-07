import React, { useEffect, useState } from 'react';
import { api } from '../api';
import TrendChart from '../components/TrendChart.jsx';

export default function Home() {
  const [homeMetrics, setHomeMetrics] = useState(null); // existing metrics from /api/home/metrics
  const [persistMetrics, setPersistMetrics] = useState(null); // new persistent metrics
  const [cron, setCron] = useState({ state: 'idle', isRunning: false, lastRunAt: null, nextRunAt: null });
  const [err, setErr] = useState('');

  // initial load + polling
  useEffect(() => {
    let mounted = true;

    const loadOnce = async () => {
      try {
        const [m1, m2, st] = await Promise.all([
          api.getMetrics().catch(() => null),
          api.getPersistentMetrics().catch(() => null),
          api.getCronStatus().catch(() => null)
        ]);
        if (!mounted) return;
        if (m1) setHomeMetrics(m1);
        if (m2) setPersistMetrics(m2);
        if (st) setCron(st);
      } catch (e) {
        if (!mounted) return;
        setErr(e?.response?.data?.error || 'Failed to load data');
      }
    };

    loadOnce();
    const id = setInterval(loadOnce, 10000); // poll every 10s
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const startCron = async () => {
    try {
      const st = await api.startCron();
      setCron(st);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to start');
    }
  };
  const stopCron = async () => {
    try {
      const st = await api.stopCron();
      setCron(st);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to stop');
    }
  };
  const pauseCron = async () => {
    try {
      const st = await api.pauseCron();
      setCron(st);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to pause');
    }
  };
  const resumeCron = async () => {
    try {
      const st = await api.resumeCron();
      setCron(st);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to resume');
    }
  };

  const total = persistMetrics?.totalRequests || 0;
  const succ = persistMetrics?.successCount || 0;
  const fail = persistMetrics?.failureCount || 0;
  const rate = total > 0 ? Math.round((succ / total) * 100) : 0;

  if (err) return <div className="center">{err}</div>;
  if (!homeMetrics) return <div className="center">Loading…</div>;

  return (
    <div>
      <h2>Home</h2>

      {/* Cron controls */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge">State: {cron.state}{cron.isRunning ? ' (running job)' : ''}</span>
            {cron.lastRunAt && <span className="small">Last: {new Date(cron.lastRunAt).toLocaleString()}</span>}
            {cron.nextRunAt && <span className="small">Next: {new Date(cron.nextRunAt).toLocaleString()}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={startCron} disabled={cron.state === 'running'}>Start</button>
            {cron.state === 'paused' ? (
              <button className="btn secondary" onClick={resumeCron}>Resume</button>
            ) : (
              <button className="btn secondary" onClick={pauseCron} disabled={cron.state !== 'running'}>Pause</button>
            )}
            <button className="btn danger" onClick={stopCron} disabled={cron.state === 'idle'}>Stop</button>
          </div>
        </div>
        <div className="small" style={{ marginTop: 8 }}>
          Pause prevents new runs from being scheduled; if a run is in progress it will finish safely. Resume will run immediately, then hourly.
        </div>
      </div>

      {/* Existing jobs metrics */}
      <div className="card-grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div>Jobs in Last Hour</div>
          <div className="big-number">{homeMetrics.jobs_last_hour}</div>
        </div>
        <div className="card">
          <div>Jobs Today</div>
          <div className="big-number">{homeMetrics.jobs_today}</div>
        </div>
      </div>

      {/* New persistent API request metrics */}
      <div className="card-grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div>Total API Requests</div>
          <div className="big-number">{total}</div>
        </div>
        <div className="card">
          <div>Successful</div>
          <div className="big-number">{succ}</div>
        </div>
        <div className="card">
          <div>Failed</div>
          <div className="big-number">{fail}</div>
        </div>
        <div className="card">
          <div>Success Rate</div>
          <div className="big-number">{rate}%</div>
        </div>
      </div>

      <TrendChart data={homeMetrics.trend_last_7_days} />
    </div>
  );
}
