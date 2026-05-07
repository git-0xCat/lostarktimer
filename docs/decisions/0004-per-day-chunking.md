# 0004: Split `data/data.json` into per-day chunks at prebuild

**Status:** Accepted
**Date:** 2026-05-06

## Context

`data/data.json` is ~76 KB raw / ~15 KB gzipped. It's loaded only on `/alarms`,
but every visit was paying the parse cost for all months even though only the
selected day is shown.

## Decision

A `prebuild` pass (`scripts/build-day-data.mjs`) splits `data.json` into
`data/days/<m>-<d>.json` files (~5–8 KB each). The alarms page does a
templated dynamic import of just the visible day:

```ts
import(/* webpackChunkName: "alarms-day-[request]" */
  `../data/days/${month}-${day}.json`)
```

Webpack scans `data/days/*.json` at build time and emits one chunk per
file. `data/days/` is gitignored — regenerated on every build, so changes
to `data.json` are picked up automatically.

## Alternatives considered

- `getStaticProps` — embeds in HTML, doesn't really shrink anything
- `getServerSideProps` — compute-per-request
- API route — extra infrastructure for a static dataset
