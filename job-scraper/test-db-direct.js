const Database = require('better-sqlite3');
const path = require('path');
const { DB_FILE } = require('./server/config');

console.log('Testing direct database connection...');

try {
  const db = new Database(DB_FILE);
  console.log('Database connected successfully');
  
  const result = db.prepare("UPDATE cron_state SET is_running=0 WHERE id=1").run();
  console.log('UPDATE query result:', result);
  
  console.log('Test completed successfully');
  process.exit(0);
} catch (error) {
  console.error('Direct database error:', error);
  process.exit(1);
}
