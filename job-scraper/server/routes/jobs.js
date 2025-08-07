const express = require('express');
const { DateTime } = require('luxon');
const { db } = require('../db');

const router = express.Router();

const ZONE = 'Europe/Berlin';

function nowBerlin() {
  return DateTime.now().setZone(ZONE);
}
function rangeForPeriod(period) {
  const now = nowBerlin();
  switch (period) {
    case 'today': {
      return {
        start: now.startOf('day').toISO(),
        end: now.endOf('day').toISO()
      };
    }
    case 'yesterday': {
      const y = now.minus({ days: 1 });
      return {
        start: y.startOf('day').toISO(),
        end: y.endOf('day').toISO()
      };
    }
    case '7': {
      const start = now.minus({ days: 6 }).startOf('day');
      return { start: start.toISO(), end: now.endOf('day').toISO() };
    }
    case '30': {
      const start = now.minus({ days: 29 }).startOf('day');
      return { start: start.toISO(), end: now.endOf('day').toISO() };
    }
    default: {
      // default to today
      return {
        start: now.startOf('day').toISO(),
        end: now.endOf('day').toISO()
      };
    }
  }
}

function buildFilters({ keyword, location }) {
  const where = ['scrape_time BETWEEN ? AND ?'];
  const params = [];
  if (keyword) {
    where.push('keyword = ?');
    params.push(keyword);
  }
  if (location) {
    where.push('location = ?');
    params.push(location);
  }
  return { where: where.join(' AND '), params };
}

router.get('/', (req, res) => {
  try {
    const { period = 'today', keyword, location, page = 1, pageSize = 50 } = req.query;
    const { start, end } = rangeForPeriod(String(period));
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.max(1, Math.min(200, parseInt(pageSize, 10) || 50));
    const offset = (p - 1) * ps;

    const { where, params } = buildFilters({ keyword, location });
    const allParams = [start, end, ...params];

    const rows = db
      .prepare(`
        SELECT id, portal, keyword, title, company, location, url, description_snippet, posting_time, scrape_time, is_repeat
        FROM Job
        WHERE ${where} AND is_repeat = 0
        ORDER BY scrape_time DESC
        LIMIT ? OFFSET ?
      `)
      .all(...allParams, ps, offset);

    // Group by hour label in Berlin
    const groupsMap = new Map();
    for (const r of rows) {
      const hour = DateTime.fromISO(r.scrape_time, { zone: ZONE }).startOf('hour');
      const label = hour.toFormat('yyyy-LL-dd HH:00');
      if (!groupsMap.has(label)) groupsMap.set(label, []);
      groupsMap.get(label).push(r);
    }
    const groups = Array.from(groupsMap.entries()).map(([hourLabel, jobs]) => ({ hourLabel, jobs }));

    res.json({
      page: p,
      pageSize: ps,
      groups
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load jobs' });
  }
});

router.get('/filters', (req, res) => {
  try {
    const sixtyDaysAgo = nowBerlin().minus({ days: 60 }).startOf('day').toISO();
    const keywords = db.prepare('SELECT DISTINCT keyword FROM Job WHERE scrape_time >= ? ORDER BY keyword ASC').all(sixtyDaysAgo).map(r => r.keyword).filter(Boolean);
    const locations = db.prepare('SELECT DISTINCT location FROM Job WHERE scrape_time >= ? ORDER BY location ASC').all(sixtyDaysAgo).map(r => r.location).filter(Boolean);
    res.json({ keywords, locations });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load filters' });
  }
});

router.get('/highlighted', (req, res) => {
  try {
    const sevenDaysAgo = nowBerlin().minus({ days: 7 }).startOf('day').toISO();
    const rows = db
      .prepare(`
        SELECT id, portal, keyword, title, company, location, url, description_snippet, posting_time, scrape_time, is_repeat
        FROM Job
        WHERE is_repeat = 1 AND scrape_time >= ?
        ORDER BY scrape_time DESC
        LIMIT 200
      `)
      .all(sevenDaysAgo);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load highlighted jobs' });
  }
});

module.exports = router;
