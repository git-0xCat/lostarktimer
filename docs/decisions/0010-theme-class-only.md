# 0010: Dark mode via `class="dark"` only, with FOUC-prevention pre-hydration script

**Status:** Accepted
**Date:** 2026-05-06

## Context

DaisyUI used `data-theme="dark"`. shadcn uses `class="dark"`. We had both
during the migration. The Tailwind dark variant is keyed on the class via
`@custom-variant dark (&:is(.dark *))` in `globals.css`.

## Decision

Class only. The pre-hydration `<script>` in `pages/_document.tsx` reads
`localStorage.darkMode` and adds `.dark` to `<html>` *before* React paints,
preventing the white flash on a dark-mode reload.

`useLocalStorage('darkMode', ...)` is the user-facing toggle; it also
broadcasts on set (see ADR 0014) so other consumers update without reload.

## Do not revert

- Don't switch to `data-theme="dark"` — the FOUC script + Tailwind variant
  + every component class would all need parallel updates.
