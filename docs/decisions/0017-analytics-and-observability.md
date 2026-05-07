# 0017: Analytics and observability stack

**Status:** Accepted
**Date:** 2026-05-07

## Context

Pre-deploy, we needed to know whether real users hit the site, which
events they care about, and whether errors are silently swallowing data.
Three separate concerns: traffic / Core Web Vitals, custom product events,
and error capture.

The legacy site shipped with Google Analytics + Cloudflare Insights, both
hardcoded inline in `pages/_app.tsx`. GA was duplicative (CF Insights
already covers traffic) and adds a privacy-policy footprint we don't
need.

## Decision

Three layers, each gated to **Vercel production only** (not preview, not
local dev) so dashboards never reflect dev or preview noise:

### 1. Cloudflare Web Analytics (traffic + CWV)

Already enabled via the project's Cloudflare account. The beacon script
lives in `components/analytics/CloudflareAnalytics.tsx`, gated on
`process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'`.

### 2. Umami (self-hosted, custom events)

Self-hosted Umami instance. Wired via
`components/analytics/UmamiScript.tsx`, which returns `null` when either
`NEXT_PUBLIC_UMAMI_SRC` or `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is unset — so
local dev and preview deploys (which don't set those vars) silently
no-op. Only the Vercel Production environment gets both env vars.

No `track(event, props)` calls yet. If we add custom event tracking
later, define a `TrackEvent` union in `components/analytics/track.ts` and
prefer firing from the action / setter site over the UI component.

### 3. Sentry (error + perf, production-only)

`@sentry/nextjs` with manual config trims:

- All three init configs (`instrumentation-client.ts`,
  `sentry.server.config.ts`, `sentry.edge.config.ts`) use
  `enabled: process.env.[NEXT_PUBLIC_]VERCEL_ENV === 'production'` inside
  `Sentry.init`. SDK is loaded but inert outside production.
- DSN comes from `NEXT_PUBLIC_SENTRY_DSN` (env var, not hardcoded).
- Sentry org + project come from `SENTRY_ORG` / `SENTRY_PROJECT` env
  vars (the build plugin reads them by default; not hardcoded in
  `next.config.js`).
- `tracesSampleRate: 0.1` — wizard default of `1.0` would burn through
  the free-tier quota fast.
- `enableLogs` removed — would forward every `console.*` call to Sentry,
  also a quota killer.
- `tunnelRoute: '/monitoring'` enabled in `next.config.js` so ad-blockers
  (uBlock, Brave Shields) can't drop client error reports.
- `automaticVercelMonitors` removed (no Vercel cron jobs in this repo).
- `pages/_error.tsx` is the Pages-Router boundary that forwards
  exceptions via `Sentry.captureUnderscoreErrorException`.

Sourcemap upload requires `SENTRY_AUTH_TOKEN` set in the Vercel
Production env (the build plugin no-ops without it).

## Why VERCEL_ENV-strict (not NODE_ENV)

`NODE_ENV === 'production'` would also light up Vercel preview deploys
and `npm run build && npm start` locally. Strict
`VERCEL_ENV === 'production'` keeps preview / local quiet at the cost of
not catching errors before they ship. If preview observability becomes
useful, switch the gate.

## Why env-var DSN/Umami values (vs hardcoded)

DSN and Umami URL/website-ID ship to every browser anyway, so there's no
secret to protect. Env vars give flexibility (swap instances, separate
staging DSN) at the cost of a Vercel setup step per project.

## Do not revert

- Don't put Google Analytics back. CF Insights covers traffic; Umami
  covers product events.
- Don't raise `tracesSampleRate` back to 1.0 without checking the Sentry
  quota first.
- Don't disable `tunnelRoute` — ad-blockers will drop any direct request
  to `*.ingest.sentry.io`.
