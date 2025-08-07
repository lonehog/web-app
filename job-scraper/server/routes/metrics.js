const express = require("express");
const router = express.Router();
const db = require("../db");

// Ensure singleton row exists (defensive)
async function ensureRow() {
  await db.run("INSERT OR IGNORE INTO metrics (id, total_requests, success_count, failure_count, last_reset_at) VALUES (1, 0, 0, 0, datetime('now'))");
}

// GET /api/metrics
router.get("/", async (req, res) => {
  try {
    await ensureRow();
    const row = await db.get("SELECT total_requests as totalRequests, success_count as successCount, failure_count as failureCount, last_reset_at as lastResetAt FROM metrics WHERE id=1");
    res.json(row || { totalRequests: 0, successCount: 0, failureCount: 0, lastResetAt: null });
  } catch (e) {
    console.error("[metrics] get error", e);
    res.status(500).json({ error: "metrics_failed" });
  }
});

// POST /api/metrics/reset (optional utility)
router.post("/reset", async (req, res) => {
  try {
    await ensureRow();
    await db.run("UPDATE metrics SET total_requests=0, success_count=0, failure_count=0, last_reset_at=datetime('now') WHERE id=1");
    const row = await db.get("SELECT total_requests as totalRequests, success_count as successCount, failure_count as failureCount, last_reset_at as lastResetAt FROM metrics WHERE id=1");
    res.json(row);
  } catch (e) {
    console.error("[metrics] reset error", e);
    res.status(500).json({ error: "reset_failed" });
  }
});

module.exports = router;
