# Progress

## What works
- Backend
  - Express server with JWT auth (HTTP-only cookie).
  - SQLite via better-sqlite3 with migrations.
  - Protected endpoints: /api/home/metrics, /api/portal (GET/POST/DELETE), /api/jobs (+ /filters, /highlighted).
  - Timezone handling via Luxon (Europe/Berlin) for storage and display.
- Scraper
  - Hourly cron inside Docker runs server/scraper/run-scrape.js.
  - LinkedIn best-effort scrape with cheerio; posting time normalization; dedupe and purge policies implemented.
  - Single retry after 5 minutes on failure; logs errors without halting whole run.
- Frontend
  - React (Vite) SPA with pages: Login, Signup, Home, Portals, Jobs.
  - Home metrics and 7-day trend chart (Recharts).
  - Portals: provider/location/keywords form, list, edit, delete.
  - Jobs: filter by period/keyword/location; infinite scroll; repeat highlight.
  - Axios client with withCredentials for cookie-based auth.
- Docker
  - Dockerfile installs tzdata + cron, builds client, sets cron.d entry, starts cron + server.
  - docker-compose mounts ./data to /data for DB persistence.

## What’s left to build or verify
- Optional logout endpoint to clear token cookie.
- Optional /api/health ping.
- Real-world verification that LinkedIn DOM selectors still match (best-effort; may need adjusting).
- Additional providers beyond LinkedIn (future enhancement).

## Current Status
- Project scaffolding complete and runnable in dev and Docker.
- Memory Bank initialized and documents current system.

## Known Issues / Risks
- LinkedIn scraping is brittle and subject to HTML/anti-bot changes.
- Single-user model; no user management UI.
- No CSRF token protection (mitigated by sameSite=Lax and same-origin in production).

## Evolution of decisions
- Chosen better-sqlite3 for simplicity and performance in a single-process environment.
- Chosen server-side hour grouping to simplify infinite scroll UI.
- Stored timestamps as ISO strings normalized to Europe/Berlin for consistency across API and UI.

## Next Steps
1) Local smoke test: npm install; npm run dev; create admin; exercise endpoints/UI.
2) Docker run: docker compose up --build; configure portal/keywords; confirm cron inserts jobs and metrics update.
3) Optionally implement logout endpoint and healthcheck.
4) Observe scraper logs and adjust selectors if LinkedIn DOM changes.
