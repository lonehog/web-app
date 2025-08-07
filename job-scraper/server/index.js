const path = require('path');
const readline = require('readline');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const config = require('./config');
const { migrate, db } = require('./db');
const { withCookies, parseUser, requireAuth } = require('./auth/authMiddleware');

const authRoutes = require('./auth/routes');
const homeRoutes = require('./routes/home');
const portalRoutes = require('./routes/portal');
const jobsRoutes = require('./routes/jobs');
const credentialsRoutes = require('./routes/credentials');

// Ensure TZ is set
process.env.TZ = config.TZ;

function promptCreateAdmin() {
  const count = db.prepare('SELECT COUNT(1) as c FROM User').get().c;
  if (count > 0) return;

  if (config.FIRST_USER_USERNAME && config.FIRST_USER_PASSWORD) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync(config.FIRST_USER_PASSWORD, 10);
    db.prepare('INSERT INTO User (username, password_hash) VALUES (?, ?)').run(config.FIRST_USER_USERNAME, hash);
    console.log(`[init] Created initial admin user "${config.FIRST_USER_USERNAME}" from env vars`);
    return;
  }

  // Interactive prompt (only if running attached)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  (async () => {
    try {
      console.log('[init] No users found. Create the initial admin user.');
      const username = (await ask('Admin username: ')).trim();
      const password = (await ask('Admin password: ')).trim();
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync(password, 10);
      db.prepare('INSERT INTO User (username, password_hash) VALUES (?, ?)').run(username, hash);
      console.log(`[init] Created admin user "${username}"`);
    } catch (e) {
      console.error('[init] Failed to create admin user', e);
    } finally {
      rl.close();
    }
  })();
}

function createApp() {
  const app = express();

  // Middlewares
  withCookies(app);
  app.use(express.json());

  if (config.NODE_ENV !== 'production') {
    app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
  }

  app.use(morgan('dev'));

  // Auth routes (unauthenticated)
  app.use('/api/auth', authRoutes);

  // Parse user after possible login
  app.use(parseUser);

  // Protected API routes
  app.use('/api/home', requireAuth, homeRoutes);
  app.use('/api/portal', requireAuth, portalRoutes);
  app.use('/api/jobs', requireAuth, jobsRoutes);
  app.use('/api/credentials', requireAuth, credentialsRoutes);

  // Serve client in production
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return app;
}

function start() {
  // Migrate DB
  migrate();

  // Prompt to create admin if needed
  promptCreateAdmin();

  // Start server
  const app = createApp();
  app.listen(config.PORT, () => {
    console.log(`[server] Listening on http://localhost:${config.PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = {
  start,
  promptCreateAdmin
};
