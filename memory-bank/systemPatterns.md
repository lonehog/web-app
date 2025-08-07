# System Patterns

## Architecture
- Monorepo with server (Express) and client (React via Vite).
- SPA built and served statically by Express in production.
- SQLite (better-sqlite3) for simple, synchronous queries and migrations.
- Cron inside the Docker container triggers a Node script hourly.

## Key Technical Decisions
- Authentication via JWT stored in HTTP-only cookie (SameSite=Lax, secure in production).
- Single-user signup permitted only when no users exist in DB; enforced at POST /api/auth/signup.
- Time zone set globally to Europe/Berlin for both storage and display using Luxon.
- Deduplication/“repeat” detection based on composite (title, company, location, posting_time) in last 60 days.
- Purge policy: remove Job rows older than 60 days on each scrape run.

## API and Routing
- Public routes: /api/auth/signup, /api/auth/login
- Protected routes: /api/home/metrics, /api/portal (GET/POST/DELETE), /api/jobs (+ /filters, /highlighted)
- Server groups jobs by hour label for simpler UI rendering and pagination.

## Scraper Pattern
- Build LinkedIn search URLs from PortalConfig and Keyword terms.
- Fetch HTML and parse with cheerio using resilient selectors.
- Normalize portal posting time to ISO in Europe/Berlin. Handle relative strings (“1 hour ago”).
- Insert jobs with scrape_time=now (Berlin) and is_repeat flag.
- Retry once after 5 minutes on failure; log errors.

## Data Layer
- Migrations are SQL files executed at startup and in scraper.
- Indices on posting_time, scrape_time, and composite key for dedupe performance.
- Foreign key constraints enabled with PRAGMA.

## Client Patterns
- Vite dev server with proxy to Express for /api.
- Pages: Login, Signup, Home (metrics + chart), Portals (config), Jobs (infinite scroll).
- Axios instance with withCredentials for cookie-based auth.
- ProtectedRoute pings a protected endpoint to infer auth state.

## Deployment Patterns
- Dockerfile installs tzdata + cron; sets /etc/cron.d/app-cron.
- CMD starts cron, migrates DB, then starts server.
- docker-compose mounts ./data to /data for SQLite persistence.
