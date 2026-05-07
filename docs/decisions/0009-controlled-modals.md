# 0009: Controlled Radix `<Dialog>` modals, page-owned state

**Status:** Accepted
**Date:** 2026-05-06

## Context

DaisyUI's checkbox-toggle pattern (`<input type="checkbox" id=…>` + `<label
htmlFor>` triggers across components) made cross-component opening implicit
and hard to reason about. We needed a clear ownership model for modal state
that worked with shadcn's Radix-based primitives.

## Decision

All modals (`AlarmConfigModal`, `MerchantConfigModal`, `ChangeLogModal`,
`GitHubModal`) take `open` + `onOpenChange` props. State lives in the page
that triggers them:

- `pages/_app.tsx` for `ChangeLogModal` + `GitHubModal` (triggered from the
  `SideBar` component via prop-drilled callbacks)
- `pages/alarms.tsx` and `pages/merchants.tsx` for their own config modals

Prop-drilling `onOpen…` callbacks into `SideBar` was simpler than
introducing a context for two booleans.

Each `<DialogContent>` needs a `<DialogDescription>` (Radix warns at runtime
without one). Use `sr-only` if a visible description doesn't fit the design.
