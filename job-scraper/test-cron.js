const cronManager = require('./server/cronManager');

console.log('Testing cron manager initialization...');

cronManager.init().then(() => {
  console.log('Cron manager initialized successfully');
  return cronManager.status();
}).then((status) => {
  console.log('Cron status:', status);
  console.log('Test completed, exiting...');
  setTimeout(() => {
    console.log('Forcing exit');
    process.exit(0);
  }, 1000);
}).catch((error) => {
  console.error('Cron manager error:', error);
  setTimeout(() => {
    console.log('Forcing exit after error');
    process.exit(1);
  }, 1000);
});
