# Next session

State of the project after the 2026-05 modernization + shadcn rewrite.
Read this first so you don't re-derive context that's already settled.

## Reading order

1. `CLAUDE.md` (repo root) — stack, layout, critical conventions
2. `docs/DECISIONS.md` — non-obvious choices and *why*. Don't
   re-litigate items here without a real reason; most have a
   linked-back commit explaining the trade.
3. `docs/ARCHITECTURE.md` — runtime data flow + theme system + modal
   pattern + region topology
4. `docs/DEPLOY.md` — pre-flight, Vercel preview, pipeline activation
5. `docs/DATA_PIPELINE.md` — scraper → lostark-alarms PR flow

## Repo state at session end

- 32 unit (Vitest) + 8 e2e (Playwright) + 32 pytest (scraper) — all
  green. Run with `npm run test`, `npm run test:e2e`, and (in
  `~/Projects/lostark-timers-scraper`) `.venv/bin/python -m pytest`.
- `npm run build` clean. `npm run typecheck` clean.
- `main` is ahead of origin: ~25 atomic commits across this repo
  haven't been pushed yet.
- `~/Projects/lostark-timers-scraper` (private) has its own ~3
  commits unpushed: resilient scraper, normalizer, commit-back
  workflow.

## On the user (operational, no code)

These are blockers before the new pipeline + deploy can take effect.

### 1. Activate the data pipeline

Currently dormant — `data/data.json` updates would still need a
manual copy-and-PR until the secret is set.

```bash
cd ~/Projects/lostark-timers-scraper
git push
```

Then on `cwjoshuak/lostark-timers-scraper` (Settings → Secrets and
variables → Actions), add:

- **`LOSTARK_ALARMS_TOKEN`** — fine-grained PAT scoped to
  `cwjoshuak/lostark-alarms` only, with `Contents: write` and
  `Pull requests: write`.

Then Actions → "Update Timers" → Run workflow. Confirm it opens a PR
against `lostark-alarms` with cleaned `data/{data,events,msgs}.json`.
Subsequent runs fire on the Monday 10:00 UTC cron.

### 2. Deploy

`lostarktimer.app` is on Vercel and auto-deploys from `main`.
Pre-flight first:

```bash
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Then push to a feature branch, eyeball the Vercel preview URL, then
merge to `main`. Steps + rollback in `docs/DEPLOY.md`.

### 3. Old credentials (deferred earlier)

User decided to skip these but they're worth remembering:

- **MongoDB Atlas cluster** `cl1.eqncf.mongodb.net` — unused by the
  app, can be torn down.
- **Supabase project** `tvcexlxwpqoxiobnfyna` — unused, can be
  deleted.
- Firebase keys in `.env.local` are `NEXT_PUBLIC_*` and not secrets;
  no rotation needed.

## Latent issues (documented, not yet acted on)

### `+10 min` calibration

`pages/alarms.tsx` applies a +10 minute offset to certain event-IDs
and type-IDs (sailing-style events). The math is correct relative to
the legacy site's behavior, but nobody has confirmed the offset is
still right in current Lost Ark. The user doesn't play the game
anymore.

Plan: deploy as-is. If users report sailing-event times are 10 min
off, drop the offset (`pages/alarms.tsx`, search for
`TYPE_IDS_INCREASE_BY_10_MIN` equivalent — the inline arrays of
`7000-7999` ids and the `1001..6011` whitelist). Or cross-reference
papunika.com / maxroll.gg / WanderLost for a same-event time.

See `docs/DECISIONS.md` § "+10 min adjustment".

### Spanning-midnight events on the next day

Source indexes each window by its **start** day. So a `23:00-01:00`
window appears on May 6's view (correctly extended into May 7) but
NOT on May 7's view at 12:30 AM. Matches legacy behavior. If we want
the May 7 view to show ongoing-from-yesterday events, the per-day
chunker would need to also bucket events under their end day. Not
trivial — defer until someone asks.

### Stale `public/locales/en/events.json`

The hand-curated EN translations are ignored in favor of metadata
names from `data/events.json` (cell rendering checks `i18n.language`).
Kept for ZH overrides via `public/locales/zh/`. Worth pruning the
EN file later for clarity, or deleting both EN+ZH if nobody actually
uses ZH. Quick `grep -L 'events.json' pages/ components/` would
confirm impact.

### Merchants page

Parked behind a "Work in Progress" banner. Websocket disconnected,
`socket.io-client` uninstalled. Static merchant data still feeds the
schedule reference cards. Future: rebuild around community-submitted
sightings (votes up/down), seeded from
`maxroll.gg/lost-ark/resources/wandering-merchant-guide` and
`Xeio/WanderLost`'s server topology. See
`memory/reference_merchant_source.md`.

## Backlog (low priority, optional)

- **Disable-menu e2e flow.** We have a dark-mode toggle e2e spec but
  not the disable-this-event-via-dropdown flow. Add when there's a
  deterministic data fixture (current data shifts day-to-day).
- **Lighthouse + axe a11y pass.** Modals get focus traps via Radix.
  Date row + filter sidebar + cells haven't been audited end-to-end
  for keyboard nav.
- **README.md.** The current root README is from 2022. CLAUDE.md is
  the agent guide; a separate human-oriented README would help
  drive-by GitHub visitors.
- **Bundle-size eyeball post-Next-16.** Turbopack output doesn't
  print per-route sizes. `du -sh .next/static/chunks/pages/alarms*`
  after a build, or use `next-bundle-analyzer`.
- **Auto-merge clean data PRs.** The pipeline currently opens a PR
  for human review. Once a few have landed clean, add an auto-merge
  rule for diffs that match a known-clean shape.
- **Disabled-event chip relative time.** Currently shows "Disabled · in
  12 hours". Could become more useful with absolute timestamps for
  longer durations.

## Things deliberately not done (don't redo without asking)

- **Don't move `data/*.json` to `public/`.** It exposes the cleaned
  schedule at a stable URL. We tried this once during the session and
  reverted. See `docs/DECISIONS.md` § "Data: bundled, not in /public".
- **Don't switch theme to `data-theme="dark"`.** shadcn uses
  `class="dark"`; the FOUC-prevention script in `_document.tsx` only
  manages the class. See `docs/DECISIONS.md` § "Theme: class only".
- **Don't put back `socket.io-client`.** Merchants is parked; the
  websocket pushed empty data and reconnected forever in dev. When
  crowdsourcing lands we'll bring back a different transport.
- **Don't re-introduce `next-i18next`.** v16 is a near-rewrite;
  bundled `react-i18next` works for our two locales. Locale routing
  (`/en/...`) is gone too.
- **Don't apply `+10 min` to start only.** That's the bug we just
  fixed. Apply to BOTH endpoints. See `docs/DECISIONS.md` § "+10 min".

## Quick health check before doing anything

```bash
node --version              # should be 22.x
cat .nvmrc                  # 22
git log --oneline -5        # know where you are
git status -s               # any uncommitted drift?
npm run typecheck && npm run test
```

If all green, you're at a known-good state and can start work.
