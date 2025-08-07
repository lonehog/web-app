const path = require('path');

const config = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret_in_production',
  DB_FILE: process.env.DB_FILE || (process.env.NODE_ENV === 'production' ? '/data/app.db' : path.join(__dirname, '..', 'app.db')),
  TZ: 'Europe/Berlin',
  FIRST_USER_USERNAME: process.env.FIRST_USER_USERNAME || null,
  FIRST_USER_PASSWORD: process.env.FIRST_USER_PASSWORD || null,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = config;
