const express = require("express");
const router = express.Router();
const cronManager = require("../cronManager");
const db = require("../db");

// Status
router.get("/status", async (req, res) => {
  try {
    const st = await cronManager.status();
    return res.json(st);
  } catch (e) {
    console.error("[cron] status error", e);
    return res.status(500).json({ error: "status_failed" });
  }
});

// Start (runs once immediately, then hourly after successful completion)
router.post("/start", async (req, res) => {
  try {
    const st = await cronManager.start({ runImmediately: true });
    return res.json(st);
  } catch (e) {
    console.error("[cron] start error", e);
    return res.status(500).json({ error: "start_failed" });
  }
});

// Stop (no new schedules; in-flight run completes)
router.post("/stop", async (req, res) => {
  try {
    const st = await cronManager.stop();
    return res.json(st);
  } catch (e) {
    console.error("[cron] stop error", e);
    return res.status(500).json({ error: "stop_failed" });
  }
});

// Pause (no new schedules; in-flight run completes)
router.post("/pause", async (req, res) => {
  try {
    const st = await cronManager.pause();
    return res.json(st);
  } catch (e) {
    console.error("[cron] pause error", e);
    return res.status(500).json({ error: "pause_failed" });
  }
});

// Resume (resume scheduling and run immediately once)
router.post("/resume", async (req, res) => {
  try {
    const st = await cronManager.resume();
    return res.json(st);
  } catch (e) {
    console.error("[cron] resume error", e);
    return res.status(500).json({ error: "resume_failed" });
  }
});

module.exports = router;
