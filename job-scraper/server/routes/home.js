const express = require('express');
const { DateTime } = require('luxon');
const { db } = require('../db');

const router = express.Router();

function nowBerlin() {
  return DateTime.now().setZone('Europe/Berlin');
}
function startOfDayBerlin(dt = nowBerlin()) {
  return dt.startOf('day');
}
function endOfDayBerlin(dt = nowBerlin()) {
  return dt.endOf('day');
}

router.get('/metrics', (req, res) => {
  try {
    const now = nowBerlin();
    const oneHourAgo = now.minus({ hours: 1 }).toISO();
    const startToday = startOfDayBerlin(now).toISO();
    const endToday = endOfDayBerlin(now).toISO();

    const jobsLastHour = db.prepare('SELECT COUNT(1) as c FROM Job WHERE scrape_time >= ?').get(oneHourAgo).c;
    const jobsToday = db.prepare('SELECT COUNT(1) as c FROM Job WHERE scrape_time BETWEEN ? AND ?').get(startToday, endToday).c;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = now.minus({ days: i });
      const start = startOfDayBerlin(day).toISO();
      const end = endOfDayBerlin(day).toISO();
      const count = db.prepare('SELECT COUNT(1) as c FROM Job WHERE scrape_time BETWEEN ? AND ?').get(start, end).c;
      days.push({ date: day.toFormat('yyyy-LL-dd'), count });
    }

    res.json({
      jobs_last_hour: jobsLastHour,
      jobs_today: jobsToday,
      trend_last_7_days: days
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute metrics' });
  }
});

module.exports = router;
