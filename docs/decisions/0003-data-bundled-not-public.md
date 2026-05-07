# 0003: Bundle `data/*.json` via webpack imports, not under `/public`

**Status:** Accepted
**Date:** 2026-05-06

## Context

The schedule files (`data/data.json`, `data/events.json`, `data/msgs.json`,
plus the per-day chunks under `data/days/`) are only consumed by the
`/alarms` route. We could expose them as static assets under `/public`
(one-line route) or import them so Next/webpack handles them.

## Decision

Import them. Two reasons it composes better with the rest of the
architecture:

1. **Per-day chunking (ADR 0004) requires webpack-importable inputs.** The
   templated dynamic import `import('../data/days/${m}-${d}.json')` only
   works because the files live inside the build graph. `/public` assets
   are served as opaque bytes; Next won't split them.
2. **Stable URLs aren't useful here.** Nothing else in the app hits these
   files — no `<a href>`, no `<img src>`, no `fetch('/data/...')`. Putting
   them under `/public` would create a public surface for content that
   has no public consumer.
