# 0008: Migrate legacy localStorage region values via shim, don't drop

**Status:** Accepted
**Date:** 2026-05-06

## Context

The localStorage key `regionTZName` may still hold a 2022-era value
(`US East`, `US West`, `EU West`, `South America`) for returning users. The
new `RegionTimeZoneMapping` (post-2024 server merges, see ADR 0011) uses
different display names: `NA East`, `NA West`, `EU Central`.

Without migration, returning users would see an empty region select on first
visit after deploy.

## Decision

`util/static.ts` `resolveRegion(stored)` maps each dead name to the closest
current region. The new mapping is the source of truth; the shim only
translates.

Chose this over silently clearing localStorage so user theme / dark-mode /
notify settings stay intact.

Also use IANA timezone names (`America/New_York`) rather than UTC offsets —
Luxon then handles DST automatically. The legacy `UTC-7` strings silently
produced wrong times for half the year.
