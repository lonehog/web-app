const path = require('path');
const readline = require('readline');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const config = require('./config');
const { migrate, db } = require('./db');

const homeRoutes = require('./routes/home');
const portalRoutes = require('./routes/portal');
const jobsRoutes = require('./routes/jobs');
const cronManager = require('./cronManager');
const cronRoutes = require('./routes/cron');
const metricsRoutes = require('./routes/metrics');

// Ensure TZ is set
process.env.TZ = config.TZ;

function createApp() {
  const app = express();

  // Middlewares
  app.use(express.json());

  if (config.NODE_ENV !== 'production') {
    app.use(cors({ origin: 'http://localhost:5173' }));
  }

  app.use(morgan('dev'));

  // Public API routes (no authentication)
  app.use('/api/home', homeRoutes);
  app.use('/api/portal', portalRoutes);
  app.use('/api/jobs', jobsRoutes);
  app.use('/api/cron', cronRoutes);
  app.use('/api/metrics', metricsRoutes);

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

  // Ensure cron is initialized to idle on boot per requirement
  cronManager.init().then(() => {
    console.log('[cron] init completed');
  }).catch((e) => {
    console.error('[cron] init error', e);
  });

  // Start server
  const app = createApp();
  const server = app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`[server] Listening on http://0.0.0.0:${config.PORT}`);
  });
  
  // Keep process alive
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}

if (require.main === module) {
  start();
}

module.exports = {
  start
};
