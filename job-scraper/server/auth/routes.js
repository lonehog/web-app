const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { signToken, cookieCookieOptions } = require('./authMiddleware');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const exists = db.prepare('SELECT COUNT(1) as cnt FROM User').get();
  if (exists.cnt > 0) {
    return res.status(403).json({ error: 'Signup disabled after first user creation' });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare('INSERT INTO User (username, password_hash) VALUES (?, ?)').run(username, hash);
    const token = signToken({ id: info.lastInsertRowid, username });
    res.cookie('token', token, cookieCookieOptions());
    return res.json({ success: true, username });
  } catch (e) {
    if (e && String(e).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  const row = db.prepare('SELECT id, username, password_hash FROM User WHERE username = ?').get(username);
  if (!row) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken({ id: row.id, username: row.username });
  res.cookie('token', token, cookieCookieOptions());
  return res.json({ success: true, username: row.username });
});

module.exports = router;
