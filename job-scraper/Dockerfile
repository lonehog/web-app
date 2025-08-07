# syntax=docker/dockerfile:1.7
# Build and run a Docker-deployable app with cron and SQLite persistence

FROM node:lts-bullseye AS base

ENV TZ=Europe/Berlin
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends tzdata cron ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /usr/src/app

# Copy root package + lock first for better caching
COPY package.json ./
# Server and client manifests
COPY client/package.json ./client/package.json

# Install root deps and client deps (client via postinstall)
RUN npm ci

# Copy the rest of the repository
COPY server ./server
COPY client ./client

# Build client
RUN npm run client:build

# Prepare data dir for SQLite
RUN mkdir -p /data && chown -R node:node /data

# Add crontab file
# We will write a crontab during build that runs the scraper each hour on the hour.
RUN echo 'SHELL=/bin/sh' > /etc/cron.d/app-cron \
 && echo 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' >> /etc/cron.d/app-cron \
 && echo 'TZ=Europe/Berlin' >> /etc/cron.d/app-cron \
 && echo '0 * * * * node /usr/src/app/server/scraper/run-scrape.js >> /var/log/cron.log 2>&1' >> /etc/cron.d/app-cron \
 && chmod 0644 /etc/cron.d/app-cron \
 && touch /var/log/cron.log

USER node

ENV NODE_ENV=production
ENV DB_FILE=/data/app.db
ENV PORT=3000

EXPOSE 3000

# Start cron in background, migrate DB, then start the API server
CMD bash -lc "cron && node -e \"require('./server/db').migrate()\" && node server/index.js"
