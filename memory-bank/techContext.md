# Tech Context

## Technologies
- Backend: Node.js (Express), CommonJS modules
- Database: SQLite via better-sqlite3 (synchronous, embedded)
- Frontend: React 18 + Vite, React Router, Recharts, Axios
- Time: Luxon with zone Europe/Berlin
- Auth: JWT in HTTP-only cookie (SameSite=Lax; secure in production)
- Scraping: node-fetch@2 + cheerio
- Logging: morgan (HTTP), console for scraper
- Container: Docker (node:lts-bullseye), cron, tzdata
- Orchestration: docker-compose

## Directory Layout
- job-scraper/
  - server/: Express app, routes, DB, scraper
  - client/: React app built by Vite and served by Express
  - Dockerfile, docker-compose.yml
  - SQLite data persisted at /data/app.db in container (./data on host)

## Development Setup
- Install: npm install (root triggers client install via postinstall)
- Dev: npm run dev (nodemon for server + Vite for client; proxy /api to 3000)
- Build client (prod): npm run client:build
- Migrate DB: npm run migrate

## Environment Variables
- NODE_ENV (production in container)
- TZ=Europe/Berlin
- PORT=3000
- DB_FILE (default /data/app.db in production)
- JWT_SECRET (optional; default provided but should be set)
- FIRST_USER_USERNAME, FIRST_USER_PASSWORD (optional non-interactive initial admin creation)

## Constraints and Considerations
- Scraping LinkedIn HTML is best-effort and subject to DOM changes and anti-bot measures.
- All timestamps stored/displayed as ISO strings localized to Europe/Berlin.
- Single-user instance; signup is only allowed when no user exists.
- better-sqlite3 is synchronous; this is acceptable for single-instance usage with light load.

## Dependencies (key)
Server:
- express, morgan, cors, cookie-parser, jsonwebtoken, bcryptjs
- better-sqlite3
- luxon
- node-fetch@2
- cheerio

Client:
- react, react-dom, react-router-dom
- axios
- recharts
- luxon
- vite, @vitejs/plugin-react

## Tool Usage Patterns
- Vite proxy for local dev: /api -> http://localhost:3000
- Axios with withCredentials for cookie auth
- Cron via /etc/cron.d/app-cron, logs to /var/log/cron.log
