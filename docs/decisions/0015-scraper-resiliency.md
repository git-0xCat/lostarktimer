# 0015: Schedule data is updated by an external pipeline

**Status:** Accepted
**Date:** 2026-05-06

## Context

`data/{data,events,msgs}.json` need to stay current with upstream event
schedules. Hand-editing on every change isn't sustainable.

## Decision

An external pipeline runs on a weekly cron, normalizes its source, and
opens a PR against this repo with updated schedule files. Each PR fully
replaces the three JSON files (atomic write — no accumulation across
runs); review the diff and merge.

The pipeline lives in a separate repository with its own ADRs covering
fetch resilience, normalization rules (midnight dedup, month rollover),
and atomic write semantics. From this repo's perspective, the pipeline is
a black box that produces well-formed PRs titled
`chore(data): weekly schedule update`.

## What stays on the consumer side (this repo)

The `+10 min` per-event-type adjustment (ADR 0007) is applied in
`pages/alarms.tsx`, NOT by the pipeline. Keeping it on the consumer side
means it can be flipped without touching the pipeline.
