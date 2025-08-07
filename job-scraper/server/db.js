const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { DB_FILE } = require('./config');

let db;

function connect() {
  if (!db) {
    // Ensure directory exists for DB file
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_FILE);
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function migrate() {
  const database = connect();
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // ensure 001_..., 002_... order
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    database.exec(sql);
  }
}

module.exports = {
  db: connect(),
  migrate,
  // lightweight promise-like wrappers used elsewhere
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      try {
        const database = connect();
        const result = database.prepare(sql).get(...params);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      try {
        const database = connect();
        database.prepare(sql).run(...params);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
};
