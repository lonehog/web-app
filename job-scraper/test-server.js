const { start } = require('./server/index.js');

console.log('Starting server...');
try {
  start();
  console.log('Server started successfully');
} catch (error) {
  console.error('Server startup error:', error);
  process.exit(1);
}
