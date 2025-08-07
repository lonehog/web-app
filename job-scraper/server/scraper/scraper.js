const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { DateTime, Duration } = require('luxon');
const { db } = require('../db');

const ZONE = 'Europe/Berlin';

function loadProviderCredentials(provider) {
  const row = db.prepare('SELECT data FROM PortalCredential WHERE provider = ?').get(provider);
  if (!row) return { data: {}, recencyHours: 24 };
  let parsed = {};
  try { parsed = JSON.parse(row.data || '{}'); } catch (_) {}
  const recencyHours = parsed.recencyHours === 1 ? 1 : 24;
  return { data: parsed, recencyHours };
}

function buildLinkedInCookieHeader(data) {
  const parts = [];
  if (data.LINKEDIN_LI_AT) parts.push(`li_at=${data.LINKEDIN_LI_AT}`);
  if (data.LINKEDIN_JSESSIONID) parts.push(`JSESSIONID="${data.LINKEDIN_JSESSIONID}"`);
  if (data.LINKEDIN_LIAP) parts.push(`liap=${data.LINKEDIN_LIAP}`);
  if (data.LINKEDIN_LIDC) parts.push(`lidc=${data.LINKEDIN_LIDC}`);
  if (data.LINKEDIN_BCOOKIE) parts.push(`bcookie=${data.LINKEDIN_BCOOKIE}`);
  if (data.LINKEDIN_BSCOOKIE) parts.push(`bscookie=${data.LINKEDIN_BSCOOKIE}`);
  return parts.join('; ');
}

// Build LinkedIn search URL with recencyHours (1 -> r3600, 24 -> r86400)
function buildLinkedInURL(term, location) {
  const q = encodeURIComponent(term);
  const loc = encodeURIComponent(location);
  // Force last hour only
  return `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}&f_TPR=r3600`;
}

function nowBerlin() {
  return DateTime.now().setZone(ZONE);
}

function parseRelativeTime(text) {
  // e.g., "1 hour ago", "2 days ago", "30 minutes ago"
  if (!text) return null;
  const t = text.trim().toLowerCase();
  const m = t.match(/(\d+)\s+(minute|minutes|hour|hours|day|days|week|weeks)\s+ago/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  let dur = {};
  if (unit.startsWith('minute')) dur = { minutes: n };
  else if (unit.startsWith('hour')) dur = { hours: n };
  else if (unit.startsWith('day')) dur = { days: n };
  else if (unit.startsWith('week')) dur = { weeks: n };
  const dt = nowBerlin().minus(Duration.fromObject(dur));
  return dt.toISO();
}

function normalizePostingTime(raw) {
  if (!raw) return nowBerlin().toISO();
  // Try parse ISO
  let iso = null;
  try {
    const dt = DateTime.fromISO(raw, { zone: ZONE });
    if (dt.isValid) iso = dt.setZone(ZONE).toISO();
  } catch (_) {}
  if (iso) return iso;

  // Try relative like "1 hour ago"
  const rel = parseRelativeTime(raw);
  if (rel) return rel;

  // Fallback: current time
  return nowBerlin().toISO();
}

function extractJobsFromHTML(html, keyword) {
  const $ = cheerio.load(html);
  const jobs = [];

  // LinkedIn public job results best-effort selectors
  $('ul.jobs-search__results-list li').each((_, el) => {
    const title = $(el).find('h3').first().text().trim() || $(el).find('.base-search-card__title').text().trim();
    const company = $(el).find('.base-search-card__subtitle').text().trim();
    const location = $(el).find('.job-search-card__location').text().trim();
    const snippet = $(el).find('.base-search-card__snippet').text().trim() || '';
    const timeRaw = $(el).find('time').attr('datetime') || $(el).find('time').text().trim();

    if (!title) return;
    jobs.push({
      portal: 'LinkedIn',
      keyword,
      title,
      company,
      location,
      description_snippet: snippet,
      posting_time: normalizePostingTime(timeRaw)
    });
  });

  // Fallback alternative structure
  if (jobs.length === 0) {
    $('.base-card').each((_, el) => {
      const title = $(el).find('.base-card__title').text().trim();
      const company = $(el).find('.base-card__subtitle').text().trim();
      const location = $(el).find('.job-search-card__location').text().trim();
      const snippet = $(el).find('.base-card__snippet').text().trim() || '';
      const timeRaw = $(el).find('time').attr('datetime') || $(el).find('time').text().trim();
      if (!title) return;
      jobs.push({
        portal: 'LinkedIn',
        keyword,
        title,
        company,
        location,
        description_snippet: snippet,
        posting_time: normalizePostingTime(timeRaw)
      });
    });
  }

  return jobs;
}

function isRepeat(job) {
  const sixtyDaysAgo = nowBerlin().minus({ days: 60 }).startOf('day').toISO();
  const row = db
    .prepare(
      `SELECT id FROM Job
       WHERE title = ? AND ifnull(company,'') = ifnull(?, '')
         AND ifnull(location,'') = ifnull(?, '')
         AND posting_time = ?
         AND scrape_time >= ?
       LIMIT 1`
    )
    .get(job.title, job.company || '', job.location || '', job.posting_time, sixtyDaysAgo);
  return !!row;
}

function insertJob(job) {
  const stmt = db.prepare(
    `INSERT INTO Job
     (portal, keyword, title, company, location, description_snippet, posting_time, scrape_time, is_repeat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const scrape_time = nowBerlin().toISO();
  const is_repeat = isRepeat(job) ? 1 : 0;
  stmt.run(
    job.portal,
    job.keyword,
    job.title,
    job.company || null,
    job.location || null,
    job.description_snippet || null,
    job.posting_time,
    scrape_time,
    is_repeat
  );
}

function purgeOld() {
  const threshold = nowBerlin().minus({ days: 60 }).toISO();
  db.prepare('DELETE FROM Job WHERE scrape_time < ?').run(threshold);
}

async function runScrapeOnce() {
  const portals = db.prepare('SELECT id, provider, location FROM PortalConfig').all();
  const keywords = db.prepare('SELECT id, portalConfigId, term FROM Keyword').all();
  const keywordsByPortal = keywords.reduce((acc, k) => {
    (acc[k.portalConfigId] = acc[k.portalConfigId] || []).push(k.term);
    return acc;
  }, {});

  // Load LinkedIn credentials once
  const liCred = loadProviderCredentials('LinkedIn');
  const cookieHeader = buildLinkedInCookieHeader(liCred.data);
  const hasCreds = cookieHeader.length > 0;

  for (const p of portals) {
    const terms = keywordsByPortal[p.id] || [];
    if (p.provider !== 'LinkedIn') continue; // currently only LinkedIn supported
    for (const term of terms) {
      const url = buildLinkedInURL(term, p.location);
      try {
        const headers = {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        };
        if (hasCreds) headers.Cookie = cookieHeader;

        const resp = await fetch(url, {
          headers,
          timeout: 20000
        });
        if (!resp.ok) {
          console.error(`[scraper] Fetch failed ${resp.status} for ${url} (creds: ${hasCreds ? 'yes' : 'no'})`);
          continue;
        }
        const html = await resp.text();
        const parsed = extractJobsFromHTML(html, term);
        for (const j of parsed) {
          insertJob(j);
        }
        console.log(`[scraper] LinkedIn (1h) "${term}" @ ${p.location} => inserted ${parsed.length}`);
      } catch (e) {
        console.error(`[scraper] Error scraping ${url}`, e && e.message ? e.message : e);
      }
    }
  }

  purgeOld();
}

async function runScrapeWithRetry() {
  try {
    await runScrapeOnce();
  } catch (e) {
    console.error('[scraper] First attempt failed, retrying in 5 minutes...', e.message || e);
    await new Promise((r) => setTimeout(r, 5 * 60 * 1000));
    await runScrapeOnce();
  }
}

module.exports = {
  runScrapeOnce,
  runScrapeWithRetry
};
