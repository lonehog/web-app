# Job Scraper (Docker-deployable)

A full-stack job-scraping web application.

- Front-end: React (hooks)
- Back-end: Node.js (Express)
- Database: SQLite (better-sqlite3)
- Auth: Single-user signup first, then login (JWT in HTTP-only cookie)
- Scheduler: Cron inside Docker (runs hourly)
- Time Zone: Europe/Berlin for all timestamps

## Quick Start (Docker)

1) Build and run with docker-compose:
```bash
docker compose up --build
```

2) First run admin creation:
- Either watch logs and follow interactive prompt to create admin user
- Or provide env vars:
```bash
FIRST_USER_USERNAME=admin FIRST_USER_PASSWORD=change_me docker compose up --build
```

3) Open http://localhost:3000

## Development

- Install root deps and client deps via postinstall:
```bash
npm install
```

- Run API (dev) + client (Vite) concurrently:
```bash
npm run dev
```

API: http://localhost:3000
Client: http://localhost:5173 (proxied /api to 3000)

## Environment

- TZ=Europe/Berlin enforced in container and app
- SQLite DB stored at /data/app.db in container (mounted to ./data on host via docker-compose)

## Scripts

- `npm run migrate` - run DB migrations
- `npm run server` - start Express in production mode
- `npm run dev` - run server and client concurrently
- `npm run client:build` - build React app

## Data Model

- User(id, username UNIQUE, password_hash)
- PortalConfig(id, provider, location)
- Keyword(id, portalConfigId FK→PortalConfig, term)
- Job(id, portal, keyword, title, company, location, description_snippet, posting_time, scrape_time, is_repeat)
- Indexes on posting_time, scrape_time, and dedupe composite

## API

All endpoints require auth (except signup/login).

- POST /api/auth/signup
- POST /api/auth/login
- GET  /api/home/metrics
- GET  /api/portal
- POST /api/portal
- DELETE /api/portal/:id
- GET  /api/jobs?period={today|yesterday|7|30}&keyword=&location=&page=&pageSize=
- GET  /api/jobs/filters
- GET  /api/jobs/highlighted

## Cron

- Schedule: `0 * * * *`
- Entry: runs `node server/scraper/run-scrape.js`
- Retry: single retry after 5 minutes on failure
- Purges jobs older than 60 days each run

## Notes

- LinkedIn markup may change; scraper is best-effort with resilient selectors and logging.
- For detached first-run, define FIRST_USER_USERNAME and FIRST_USER_PASSWORD to avoid prompt.
