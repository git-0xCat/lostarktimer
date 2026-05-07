import { RegionKey } from './types/types'

// IANA timezone names so Luxon handles DST automatically. The legacy
// fixed-offset values (UTC-7, UTC-4, ...) silently produced wrong times
// for half the year.
export const RegionTimeZoneMapping: { [K in RegionKey]: string } = {
  'NA East': 'America/New_York',
  'NA West': 'America/Los_Angeles',
  'EU Central': 'Europe/Warsaw',
}

// Migration shim: localStorage may still hold a region name from before
// the 2024 server merges (US East / US West / EU West / South America).
// Map the dead names to the closest current region so the region select
// doesn't render an empty value on first paint.
const LEGACY_REGION_MAP: Record<string, RegionKey> = {
  'US East': 'NA East',
  'US West': 'NA West',
  'EU West': 'EU Central',
  'South America': 'NA East',
}

export const resolveRegion = (
  stored: string | undefined
): RegionKey => {
  if (stored && stored in RegionTimeZoneMapping) {
    return stored as RegionKey
  }
  if (stored && stored in LEGACY_REGION_MAP) {
    return LEGACY_REGION_MAP[stored]
  }
  return 'NA East'
}
