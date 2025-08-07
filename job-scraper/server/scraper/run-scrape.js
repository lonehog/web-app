const { migrate } = require('../db');
const { runScrapeWithRetry } = require('./scraper');

(async () => {
  try {
    migrate();
    await runScrapeWithRetry();
    process.exit(0);
  } catch (e) {
    console.error('[run-scrape] Fatal error', e);
    process.exit(1);
  }
})();
