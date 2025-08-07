const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { JWT_SECRET, NODE_ENV } = require('../config');

function withCookies(app) {
  app.use(cookieParser());
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function parseUser(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username };
  } catch (e) {
    // invalid token: clear cookie
    res.clearCookie('token', cookieCookieOptions());
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function cookieCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
    path: '/'
  };
}

module.exports = {
  withCookies,
  parseUser,
  requireAuth,
  signToken,
  cookieCookieOptions
};
