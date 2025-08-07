# Product Context

## Why this project exists
Tracking job postings across portals is tedious and time-sensitive. This app centralizes configuration (provider, location, keywords) and automatically scrapes on a schedule to provide metrics and searchable history with repeat-detection.

## Problems it solves
- Manual search across job portals.
- Lack of historical context and trends.
- Re-encountering the same postings without visibility.
- Non-persistent scraping workflows that are hard to deploy.

## How it should work (user perspective)
1) First run: create admin user (or via env vars).
2) Log in, configure a portal (LinkedIn) with location and a list of keywords.
3) Hourly, the scraper fetches new job postings per keyword.
4) View home metrics (last hour, today, weekly trend).
5) Use Jobs page to filter by period, keyword, location; infinite scroll results; repeat posts are highlighted.
6) Maintain/search jobs kept for 60 days; older entries are purged automatically.

## UX goals
- Minimal setup; Docker-first deployment.
- Clear metrics at a glance.
- Fast filtering/infinite scrolling for exploration.
- Simple portal configuration with add/remove keywords.
- Consistent Europe/Berlin timestamp display.

## Success criteria
- Hourly cron jobs run inside container.
- Repeat detection works reliably on composite fields.
- API endpoints are authenticated and stable.
- SQLite persists data via a mounted volume.
- React app is responsive and intuitive.
