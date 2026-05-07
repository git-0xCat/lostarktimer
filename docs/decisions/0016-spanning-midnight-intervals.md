# 0016: Roll spanning-midnight intervals' end forward by a day

**Status:** Accepted
**Date:** 2026-05-06

## Context

Some source windows cross midnight (`23:00-01:00`). The interval builder
constructs both endpoints on the same calendar day, so `end < start` and
`Interval.fromDateTimes` returns an invalid interval (null start). The
legacy code had a defensive filter on `todayEvents` that quietly dropped
these; with per-day chunking (ADR 0004) we removed that filter, so the
brokenness became visible.

## Decision

Roll `end` forward by a day when it'd land before `start`. Source still
indexes each window by its **start** day, so a `23:00-01:00` window
appears on May 6's view (correctly extended into May 7) but NOT on May
7's view at 12:30 AM.

This wasn't a regression introduced by chunking — the dropping-filter was
masking the bug all along.

## Future direction (not yet acted on)

If we want the May 7 view to show ongoing-from-yesterday events, the
per-day chunker would need to also bucket events under their end day.
Non-trivial — defer until a user asks for it.
