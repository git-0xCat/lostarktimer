# 0002: Lock current behavior in tests before sweeping upgrades

**Status:** Accepted
**Date:** 2026-05-06

## Context

The original plan was to write component + e2e tests covering current behavior
**before** the dep upgrade so regressions would be caught.

## Decision

Tests first. We collapsed some of this when the npm install pulled Next 16
directly (the manifest had `"next": "latest"`), but the principle held — every
dep upgrade ran against the existing test suite. UI polish goes last; the
revamps don't get to skip the safety net.

The user's standing preference for revamps is "tests first" and is captured as
a feedback memory.
