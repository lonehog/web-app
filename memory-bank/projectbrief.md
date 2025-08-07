# Project Brief: Docker-deployable Job Scraper

## Goal
Build a Docker-deployable job-scraping web application with:
- Frontend: React (hooks)
- Backend: Node.js (Express)
- DB: SQLite (file-based)
- Auth: Single-user signup on first run, then login (hashed password)
- Scheduler: Cron inside container (hourly)
- Time Zone: Europe/Berlin for storage and display

## Core Features
- Configure job search portals (LinkedIn initially) with location and keywords.
- Hourly scraper runs inside container, fetching jobs and inserting into DB.
- Deduplicate/repeat detection across last 60 days based on (title, company, location, posting_time).
- Purge jobs older than 60 days.
- Authenticated API providing metrics, portal config CRUD, job listing with filters and infinite scroll.
- React UI: Home metrics + chart, Portals config page, Jobs list with filters and infinite scroll.

## Deliverables
- Full codebase (server + client), SQLite schema, Dockerfile, docker-compose, cron config, README.
