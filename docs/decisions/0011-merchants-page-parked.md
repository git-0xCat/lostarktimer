# 0011: Park `/merchants` behind a WIP banner; disconnect the websocket

**Status:** Accepted
**Date:** 2026-05-06

## Context

`wss://ws.lostarktimer.app` was opened on every `/merchants` mount,
reconnected in dev, and pushed empty data into the table — the upstream is
either dead or stale. With no live data, the table was misleading.

## Decision

Render a "Work in Progress: crowdsourced votes coming" banner in place of
the live table. Drop the socket effects and the `socket.io-client` dep
entirely.

Static merchant data (`data/merchants.json`, `data/merchantSchedules.json`)
still feeds the schedule reference cards.

Future direction: rebuild around community-submitted sightings (votes
up/down), seeded from
[`maxroll.gg/lost-ark/resources/wandering-merchant-guide`](https://maxroll.gg/lost-ark/resources/wandering-merchant-guide)
and `Xeio/WanderLost`'s server topology. When that lands, use a different
transport — the old socket isn't worth resurrecting.

## Do not revert

- Don't put back `socket.io-client`. The websocket pushed empty data and
  reconnected forever in dev.
