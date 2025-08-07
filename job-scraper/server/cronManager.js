const db = require("./db");
const { runScrapeWithRetry } = require("./scraper/scraper");

class CronManager {
  constructor() {
    this.timer = null;
    this.intervalMinutes = 60; // default, persisted in DB too
    this.isRunningJob = false;
    this.inited = false;
  }

  async init() {
    if (this.inited) {
      console.log('[cron] Already initialized');
      return;
    }
    console.log('[cron] Initializing...');
    
    // Load persisted cron state
    const row = await db.get("SELECT state, last_run_at as lastRunAt, next_run_at as nextRunAt, interval_minutes as intervalMinutes, is_running as isRunning FROM cron_state WHERE id=1");
    console.log('[cron] Loaded row:', row);
    
    if (!row) {
      console.log('[cron] No existing state, creating default');
      await db.run("INSERT OR IGNORE INTO cron_state (id, state, interval_minutes, is_running) VALUES (1, 'idle', 60, 0)");
      this.inited = true;
      console.log('[cron] Default state created');
      return;
    }
    
    this.intervalMinutes = row.intervalMinutes || 60;
    console.log('[cron] Interval minutes set to:', this.intervalMinutes);

    // Ensure no timer on boot; respect persisted state
    if (row.state === "running") {
      console.log('[cron] State was running, resetting to idle');
      // Persisted state says running, but we start idle until user clicks Start per requirement.
      console.log('[cron] About to run UPDATE query...');
      await db.run("UPDATE cron_state SET state='idle', next_run_at=NULL, is_running=0 WHERE id=1");
      console.log('[cron] UPDATE query completed');
    } else {
      console.log('[cron] State was not running, setting is_running=0');
      console.log('[cron] About to run second UPDATE query...');
      await db.run("UPDATE cron_state SET is_running=0 WHERE id=1");
      console.log('[cron] Second UPDATE query completed');
    }
    
    this.clearTimer();
    this.inited = true;
    console.log('[cron] Initialization completed');
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = null;
  }

  async status() {
    const row = await db.get("SELECT state, last_run_at as lastRunAt, next_run_at as nextRunAt, interval_minutes as intervalMinutes, is_running as isRunning FROM cron_state WHERE id=1");
    return {
      state: row?.state || "idle",
      lastRunAt: row?.lastRunAt || null,
      nextRunAt: row?.nextRunAt || null,
      intervalMinutes: row?.intervalMinutes || this.intervalMinutes,
      isRunning: !!row?.isRunning,
    };
  }

  async start({ runImmediately = true } = {}) {
    await this.init();
    const st = await this.status();
    if (st.state === "running") return st;

    // set running state
    await db.run("UPDATE cron_state SET state='running' WHERE id=1");
    this.schedule();

    if (runImmediately) {
      // Kick off one run now (does not block scheduling, but schedule is interval-based)
      this.runOnce().catch((err) => {
        console.error("Initial run error:", err);
      });
    }
    return this.status();
  }

  async stop() {
    await this.init();
    await db.run("UPDATE cron_state SET state='idle', next_run_at=NULL WHERE id=1");
    this.clearTimer();
    return this.status();
  }

  async pause() {
    await this.init();
    await db.run("UPDATE cron_state SET state='paused', next_run_at=NULL WHERE id=1");
    this.clearTimer();
    return this.status();
  }

  async resume() {
    await this.init();
    const st = await this.status();
    if (st.state !== "paused") return st;
    await db.run("UPDATE cron_state SET state='running' WHERE id=1");
    this.schedule();
    // On resume, run immediately as per plan
    this.runOnce().catch((err) => console.error("Resume run error:", err));
    return this.status();
  }

  schedule() {
    this.clearTimer();
    // hourly cadence
    const ms = this.intervalMinutes * 60 * 1000;
    this.timer = setInterval(() => {
      this.runOnce().catch((err) => console.error("Scheduled run error:", err));
    }, ms);

    // compute next run time if no job is running; next run = now + interval
    const next = new Date(Date.now() + this.intervalMinutes * 60 * 1000).toISOString();
    db.run("UPDATE cron_state SET next_run_at=? WHERE id=1", [next]).catch((e) => console.error(e));
  }

  async runOnce() {
    // Check current state and whether a job is already running
    const st = await this.status();
    if (st.state !== "running") return;
    if (this.isRunningJob) return;

    this.isRunningJob = true;
    await db.run("UPDATE cron_state SET is_running=1 WHERE id=1");

    try {
      await runScrapeWithRetry();
      const nowIso = new Date().toISOString();
      await db.run("UPDATE cron_state SET last_run_at=? WHERE id=1", [nowIso]);

      // schedule next run after success: now + 60 minutes
      const nextIso = new Date(Date.now() + this.intervalMinutes * 60 * 1000).toISOString();
      // only set nextRun if still running (not paused/stopped during run)
      const nowState = await this.status();
      if (nowState.state === "running") {
        await db.run("UPDATE cron_state SET next_run_at=? WHERE id=1", [nextIso]);
      } else {
        await db.run("UPDATE cron_state SET next_run_at=NULL WHERE id=1");
      }
    } catch (e) {
      console.error("Scrape run failed:", e);
      // Even on failure, set nextRun to now + interval for simplicity
      const nextIso = new Date(Date.now() + this.intervalMinutes * 60 * 1000).toISOString();
      const nowState = await this.status();
      if (nowState.state === "running") {
        await db.run("UPDATE cron_state SET next_run_at=? WHERE id=1", [nextIso]);
      } else {
        await db.run("UPDATE cron_state SET next_run_at=NULL WHERE id=1");
      }
    } finally {
      this.isRunningJob = false;
      await db.run("UPDATE cron_state SET is_running=0 WHERE id=1");
    }
  }
}

module.exports = new CronManager();
