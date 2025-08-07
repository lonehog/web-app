const path = require('path');

const config = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  DB_FILE: process.env.DB_FILE || (process.env.NODE_ENV === 'production' ? '/data/app.db' : path.join(__dirname, '..', 'app.db')),
  TZ: 'Europe/Berlin',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = config;
