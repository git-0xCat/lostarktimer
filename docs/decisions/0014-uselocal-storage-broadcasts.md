# 0014: `useLocalStorage` broadcasts on `setValue` for cross-instance sync

**Status:** Accepted
**Date:** 2026-05-06

## Context

Multiple consumers of the same key (e.g. settings modal toggle + page
filter row) used to drift — toggling a checkbox in one didn't update the
other until reload. The native `storage` event only fires across tabs, not
within the same tab.

## Decision

`util/useLocalStorage.ts` dispatches a `lostark:localStorage` custom event
on every `setValue`. Every other instance subscribed to the same key
listens for that event and updates state in place. Cross-tab updates still
use the native `storage` event.

## Do not revert

- Don't replace `useLocalStorage` with raw `localStorage` access without
  preserving the broadcast — UI drift will silently return.
