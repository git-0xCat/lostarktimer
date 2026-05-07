# 0007: Apply +10 min adjustment to BOTH start AND end of event windows

**Status:** Accepted
**Date:** 2026-05-06

## Context

Legacy code (`lostarktimer-utils/scraper.js`, `lostarktimer-bot/index.js`)
bumps certain type-IDs (sailing, ocean co-ops) and event-IDs forward by 10
min to match in-game spawn timing. The pre-modernization `pages/alarms.tsx`
applied the bump only to start, then reconstructed end from the source's
end-hour string. That worked when the source sent single times like `"2:00"`
(the end-hour fallback used `start.hour` after the bump).

After `normalize.py` started canonicalising single times to `"2:00-2:00"`,
end was no longer falling back, and applying +10 to only start produced
`start=02:10`, `end=02:00` — interval inverted, displayed as a 23h50m
"spanning-midnight" window.

## Decision

Apply +10 to BOTH endpoints. Matches the legacy
`lostarktimer-utils/scraper.js` behavior. The adjustment itself is kept on
because it's been baked into the public site's behavior for years; nobody
playing the game has cross-checked whether it's still right.

If users report sailing-event times are 10 min off, drop the offset entirely
(both call sites in `pages/alarms.tsx` need the same treatment). Until then,
no flip.

## Do not revert

Applying +10 to start only is the bug we just fixed. If you're touching this
code and it looks redundant, it isn't.
