const { db, migrate } = require('./server/db');

console.log('Testing database connection...');

try {
  // Test basic query
  const result = db.prepare('SELECT 1 as test').get();
  console.log('Database query result:', result);
  
  // Test migration
  console.log('Running migrations...');
  migrate();
  console.log('Migrations completed');
  
  process.exit(0);
} catch (error) {
  console.error('Database error:', error);
  process.exit(1);
}
