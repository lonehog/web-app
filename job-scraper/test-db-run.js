const { run } = require('./server/db');

console.log('Testing db.run function...');

run("UPDATE cron_state SET is_running=0 WHERE id=1")
  .then(() => {
    console.log('db.run completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('db.run error:', error);
    process.exit(1);
  });
