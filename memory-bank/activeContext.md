# Active Context

## Current Work Focus
- Implemented full-stack Docker-deployable job scraper.
- Ensured Timezone Europe/Berlin for all timestamps.
- Added hourly cron inside the container to execute scraper with single retry.
- Enforced single-user signup then cookie-based JWT login for all API access.
- Initialized Memory Bank per project with core docs.

## Recent Changes
- Server: Express app, JWT auth, protected routes, SQLite via better-sqlite3, metrics and jobs endpoints, portal CRUD.
- Scraper: LinkedIn best-effort HTML parsing, normalization of posting_time, dedupe in last 60 days, purge policy.
- Client: React SPA (Vite), pages for Login, Signup, Home (metrics + chart), Portals (config), Jobs (infinite scroll), styles and components.
- Docker: Dockerfile with tzdata + cron, cron.d entry, CMD starts cron+migrate+server; docker-compose with data volume.
- DB: Migrations file with schema and indexes; migrations executed at startup and by scraper.

## Next Steps
- Smoke test locally: npm install, npm run dev; validate login, portal config, metrics, jobs UI.
- Container test: docker compose up --build; verify cron logs (/var/log/cron.log) and scraper inserts jobs after configuring portal/keywords.
- Optionally add: logout endpoint to clear token cookie; healthcheck endpoint; enhanced scraper resilience.

## Important Decisions & Considerations
- Store timestamps as ISO strings in Europe/Berlin (Luxon).
- Deduplication key: (title, company, location, posting_time).
- Signup disabled after first user exists (enforced at /api/auth/signup).
- For detached container first-run, create admin via FIRST_USER_USERNAME/PASSWORD envs.

## Learnings / Insights
- LinkedIn DOM can change; selectors include fallbacks and will log rather than fail the entire run.
- Infinite scroll is simplified by server-side hour grouping + pagination.
