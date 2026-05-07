# 0006: Prefer `data/events.json` metadata over `public/locales/en/events.json`

**Status:** Accepted
**Date:** 2026-05-06

## Context

The hand-curated `public/locales/en/events.json` was 2 years stale; some
strings disagreed with current event names (e.g.
`[Assail]Preigelli-[Siege]-[Raid]Liebertane` vs the cleaner
`[Siege] Preigelli VS. Liebertane` in the freshly-scraped metadata).

## Decision

Cell rendering prefers the metadata name from `data/events.json` (regenerated
weekly by the scraper, see `docs/DATA_PIPELINE.md`) when the active language
is EN, and falls back to i18n only for non-EN locales or when metadata is
missing.

ZH overrides keep working via `public/locales/zh/`. The stale EN file is
kept on disk only because deleting it would be a separate cleanup pass; it
isn't loaded.
