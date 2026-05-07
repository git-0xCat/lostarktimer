# 0005: Bundled `react-i18next` instead of `next-i18next`

**Status:** Accepted
**Date:** 2026-05-06

## Context

`next-i18next` v16 was a near-total rewrite that no longer ships the
`useTranslation` / `serverSideTranslations` / `appWithTranslation` helpers we
used. Pinning to v15 also wasn't compatible with Next 16, which removed the
`i18n` config from `next.config.js` entirely.

## Decision

Bundle translations directly via `util/i18n.ts` and use
`i18n.changeLanguage(...)` for switching. The locale surface is small (EN +
ZH, mostly UI labels) so bundling adds negligible weight.

Locale routing (`/en/alarms` vs `/zh/alarms`) is gone — that was a cosmetic
feature nobody was using.
