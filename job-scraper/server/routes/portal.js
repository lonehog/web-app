const express = require('express');
const { db } = require('../db');

const router = express.Router();

// Helper to load portals with keywords
function loadPortals() {
  const portals = db.prepare('SELECT id, provider, location FROM PortalConfig ORDER BY id DESC').all();
  const keywordsByPortal = db.prepare('SELECT id, portalConfigId, term FROM Keyword').all()
    .reduce((acc, k) => {
      acc[k.portalConfigId] = acc[k.portalConfigId] || [];
      acc[k.portalConfigId].push({ id: k.id, term: k.term });
      return acc;
    }, {});
  return portals.map(p => ({
    id: p.id,
    provider: p.provider,
    location: p.location,
    keywords: keywordsByPortal[p.id] || []
  }));
}

// GET /api/portal - list configured portals + keywords
router.get('/', (req, res) => {
  try {
    return res.json(loadPortals());
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load portals' });
  }
});

// POST /api/portal - add/update a portal (provider, location, keywords[])
router.post('/', (req, res) => {
  const { id, provider, location, keywords } = req.body || {};
  if (!provider || !location || !Array.isArray(keywords)) {
    return res.status(400).json({ error: 'provider, location and keywords[] required' });
  }

  const tx = db.transaction(() => {
    let portalId = id;
    if (portalId) {
      db.prepare('UPDATE PortalConfig SET provider = ?, location = ? WHERE id = ?').run(provider, location, portalId);
      db.prepare('DELETE FROM Keyword WHERE portalConfigId = ?').run(portalId);
    } else {
      const info = db.prepare('INSERT INTO PortalConfig (provider, location) VALUES (?, ?)').run(provider, location);
      portalId = info.lastInsertRowid;
    }
    const insertKw = db.prepare('INSERT INTO Keyword (portalConfigId, term) VALUES (?, ?)');
    for (const term of keywords) {
      if (typeof term === 'string' && term.trim().length > 0) {
        insertKw.run(portalId, term.trim());
      }
    }
    return portalId;
  });

  try {
    const portalId = tx();
    return res.json({ id: portalId });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to save portal' });
  }
});

// DELETE /api/portal/:id - remove portal + its keywords
router.delete('/:id', (req, res) => {
  const portalId = Number(req.params.id);
  if (!portalId) return res.status(400).json({ error: 'invalid id' });

  try {
    db.prepare('DELETE FROM PortalConfig WHERE id = ?').run(portalId);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete portal' });
  }
});

module.exports = router;
