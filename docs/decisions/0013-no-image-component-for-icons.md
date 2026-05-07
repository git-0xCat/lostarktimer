# 0013: Plain `<img>` for tiny icons (no Next/Image)

**Status:** Accepted
**Date:** 2026-05-06

## Context

Next's `<Image>` component goes through Vercel's image-transformation
pipeline, which is metered (free tier has a low monthly cap; overages
cost). The icons we use are 20×20 and 38×38 PNGs — any "optimization" the
pipeline could add is negligible.

## Decision

Use `<img loading="lazy" decoding="async" />` for icon-sized assets.
Reserves the entire transformation quota for any future use case that
actually needs it (banners, posters, etc.).

If/when we add a route that displays large user-supplied or scraped images,
re-introduce `<Image>` for those specific call sites only.
