# Architecture decisions

Lightweight ADRs (Architecture Decision Records) for lostark-alarms. Each
file captures a fork-in-the-road choice and the *why*, so future-you (or
future-me, the model) can pick up cold and understand the reasoning rather
than re-deriving it.

## Index

1. [Modernize the existing Next.js app + adopt shadcn/ui](0001-stack-modernization.md) — picked over picking up `lostarktimer-v2` or going native iOS
2. [Lock current behavior in tests before sweeping upgrades](0002-tests-first-on-revamps.md) — tests first; UI polish last
3. [Bundle `data/*.json` into webpack chunks; never expose under `/public`](0003-data-bundled-not-public.md) — friction against trivial scraping
4. [Split `data/data.json` into per-day chunks at prebuild](0004-per-day-chunking.md) — only fetch the visible day; templated dynamic import
5. [Bundled `react-i18next` instead of `next-i18next`](0005-i18n-bundled-react-i18next.md) — v16 is a near-rewrite; locale routing dropped
6. [Prefer `data/events.json` metadata over hand-curated EN translations](0006-event-labels-from-metadata.md) — metadata is fresh; EN file was 2 years stale
7. [Apply +10 min adjustment to BOTH start AND end of event windows](0007-plus-ten-min-on-both-ends.md) — the inverted-interval fix
8. [Migrate legacy localStorage region values via shim, don't drop](0008-region-migration-shim.md) — returning users keep their settings
9. [Controlled Radix `<Dialog>` modals, page-owned state](0009-controlled-modals.md) — `open` + `onOpenChange` props, no checkbox-toggle pattern
10. [Dark mode via `class="dark"` only, with FOUC-prevention pre-hydration script](0010-theme-class-only.md) — shadcn convention; no `data-theme`
11. [Park `/merchants` behind a WIP banner; disconnect the websocket](0011-merchants-page-parked.md) — upstream pushed empty data; rebuild around community submissions later
12. [Drop `--legacy-peer-deps` once the lockfile resolved cleanly](0012-no-legacy-peer-deps.md) — temporary scaffold for the React 17→19 upgrade
13. [Plain `<img>` for tiny icons (no Next/Image)](0013-no-image-component-for-icons.md) — preserves Vercel's metered transformation quota
14. [`useLocalStorage` broadcasts on `setValue` for cross-instance sync](0014-uselocal-storage-broadcasts.md) — same-tab updates need a custom event; native `storage` is cross-tab only
15. [Scraper resilience — fail loud, write atomically, normalize at scrape time](0015-scraper-resiliency.md) — testable units; private repo for source-domain privacy
16. [Roll spanning-midnight intervals' end forward by a day](0016-spanning-midnight-intervals.md) — `Interval.fromDateTimes` would otherwise return null
17. [Analytics and observability stack](0017-analytics-and-observability.md) — Cloudflare Insights + Umami + Sentry, all VERCEL_ENV-strict
18. [Force jsdom's `localStorage` onto `globalThis` in `vitest.setup.ts`](0018-vitest-jsdom-storage-shadow.md) — Node 22+ builtin shadows jsdom's

## Status conventions

- **Accepted** — currently in effect
- **Superseded by ADR XXXX** — replaced; kept for history
- **Proposed** — written down but not yet implemented
- **Rejected** — considered and decided against; kept so the decision isn't re-litigated

## When to add a new ADR

Write one when you make a choice you'd struggle to reconstruct from
`git log` alone — typically: pick a tool, swap an architecture, scope
something out, accept a non-obvious trade-off. Don't write one for routine
code or implementation details.
