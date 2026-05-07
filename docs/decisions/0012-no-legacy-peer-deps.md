# 0012: Drop `--legacy-peer-deps` once the lockfile resolved cleanly

**Status:** Accepted
**Date:** 2026-05-06

## Context

`--legacy-peer-deps` was added during the React 17 → React 19 migration
when peer-dep ranges were inconsistent across `@testing-library/react`,
`next-i18next`, and Next 12.

## Decision

Once everything was on the modern lockfile, a clean `npm install` resolved
without the flag. Removed from local + CI workflow.

If you re-add it during a future upgrade, treat that as a temporary
scaffold — file a follow-up to remove it once the dep tree settles.
