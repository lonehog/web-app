const express = require('express');
const { DateTime } = require('luxon');
const { db } = require('../db');

const router = express.Router();
const ZONE = 'Europe/Berlin';

function nowISO() {
  return DateTime.now().setZone(ZONE).toISO();
}

function normalizeProvider(p) {
  if (!p) return null;
  const s = String(p).trim();
  if (/^linkedin$/i.test(s)) return 'LinkedIn';
  return null; // extend in future for other providers
}

function sanitizeData(provider, data) {
  if (provider === 'LinkedIn') {
    const out = {};
    // Accept user-provided names exactly as requested by user
    const allowed = [
      'LINKEDIN_LI_AT',
      'LINKEDIN_JSESSIONID',
      'LINKEDIN_LIAP',
      'LINKEDIN_LIDC',
      'LINKEDIN_BCOOKIE',
      'LINKEDIN_BSCOOKIE'
    ];
    for (const k of allowed) {
      if (data && typeof data[k] !== 'undefined' && data[k] !== null && String(data[k]).trim() !== '') {
        out[k] = String(data[k]).trim();
      }
    }
    // Force hourly searches only
    out.recencyHours = 1;
    return out;
  }
  return {};
}

// GET /api/credentials - list summary (no secrets by default)
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT provider, data, updated_at FROM PortalCredential ORDER BY provider ASC').all();
    const result = rows.map(r => {
      let parsed = {};
      try { parsed = JSON.parse(r.data || '{}'); } catch (_) {}
      return {
        provider: r.provider,
        keysPresent: Object.keys(parsed),
        updated_at: r.updated_at
      };
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list credentials' });
  }
});

// GET /api/credentials/:provider?includeSecrets=true|false
router.get('/:provider', (req, res) => {
  const provider = normalizeProvider(req.params.provider);
  if (!provider) return res.status(400).json({ error: 'Unsupported provider' });
  const includeSecrets = String(req.query.includeSecrets || 'false') === 'true';
  try {
    const row = db.prepare('SELECT provider, data, updated_at FROM PortalCredential WHERE provider = ?').get(provider);
    if (!row) {
      return res.json({ provider, keysPresent: [], updated_at: null, ...(includeSecrets ? { data: {} } : {}) });
    }
    let parsed = {};
    try { parsed = JSON.parse(row.data || '{}'); } catch (_) {}
    if (includeSecrets) {
      return res.json({ provider, data: parsed, updated_at: row.updated_at });
    }
    return res.json({ provider, keysPresent: Object.keys(parsed), updated_at: row.updated_at });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load credential' });
  }
});

// POST /api/credentials - upsert
router.post('/', (req, res) => {
  const { provider: rawProvider, data } = req.body || {};
  const provider = normalizeProvider(rawProvider);
  if (!provider) return res.status(400).json({ error: 'Unsupported or missing provider' });
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Missing data payload' });

  const sanitized = sanitizeData(provider, data);
  const payload = JSON.stringify(sanitized);
  const updated_at = nowISO();

  try {
    const upsert = db.prepare(`
      INSERT INTO PortalCredential (provider, data, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(provider) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `);
    upsert.run(provider, payload, updated_at);
    return res.json({ success: true, provider, updated_at });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to save credential' });
  }
});

module.exports = router;
