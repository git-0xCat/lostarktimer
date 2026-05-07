# 0001: Modernize the existing Next.js app + adopt shadcn/ui

**Status:** Accepted
**Date:** 2026-05-06

## Context

Three directions considered: modernize the existing Next.js app, pick up the
abandoned `lostarktimer-v2` Next 13 + Supabase rewrite, or rewrite as native iOS.

## Decision

Modernize the existing app. The site is live on Vercel, the user is the only
maintainer, and we wanted a working production site fast. v2 was a
half-finished skeleton that would mean rebuilding everything. Native iOS is
parked as a possible future.

DaisyUI 5 was kept briefly during the dep upgrade so the upgrade-then-redesign
sequence was simpler. Once that landed we did a clean rewrite to **shadcn/ui**
(5-phase plan: scaffold → modals → chrome → cells → polish) because the
post-DaisyUI-5 visuals weren't satisfying and the user wanted modern feel.
