# Deploy

`lostarktimer.app` is hosted on Vercel and auto-deploys from `main`.

## Pre-flight

Before pushing to `main`:

```bash
npm run typecheck     # tsc --noEmit, must be clean
npm run test          # Vitest, all green
npm run test:e2e      # Playwright, all green
npm run build         # production build, must succeed
```

If any of those fail, fix before merging.

## Vercel preview before main

Push a feature branch first, let Vercel preview-deploy, smoke the
preview URL (`lostark-alarms-<branch>.vercel.app`). Catches
prod-only regressions (env-var differences, edge-runtime issues,
build-time vs runtime path quirks) before they hit users.

## Activating the data pipeline

The auto-PR weekly-update flow needs three things on the user's side:

1. **Push the scraper repo.** From `~/Projects/lostark-timers-scraper`,
   `git push`. The local commits include the resilient scraper, the
   normalizer, the pytest suite, and the workflow that PRs cleaned
   data here.

2. **Add the `LOSTARK_ALARMS_TOKEN` secret** on
   `cwjoshuak/lostark-timers-scraper` (Settings → Secrets and variables
   → Actions). Use a fine-grained PAT scoped to
   `cwjoshuak/lostark-alarms` only, with permissions:
   - Contents: write
   - Pull requests: write

3. **Trigger the workflow once.** Actions tab → "Update Timers" →
   Run workflow. Confirms it can scrape, normalize, and open a PR
   here. Subsequent runs fire on the Monday 10:00 UTC cron.

The scraper writes to its own `data/` directory and copies into
`data/` here. The next prebuild on Vercel will regenerate
`data/days/` chunks from the new `data.json`. No manual step.

## Reverting

```bash
git revert <sha>   # individual commits
```

The session is split into ~25 atomic commits. Look at `git log
--oneline` and revert per concern:

- Modernization itself: `chore(deps): modernize stack...`
- shadcn rewrite: `feat(ui): scaffold shadcn...` plus the four phase commits
- Region migration: `feat(regions): adopt 2024 server topology...`
- Per-day chunking: `perf(alarms): pre-build per-day data chunks...`
- +10 fix: `fix(alarms): apply +10min offset to both start AND end...`

Each phase is independently revertable in theory, though later
commits will probably need cascading reverts in practice.

## Watching prod

After merging:

- Check `lostarktimer.app/alarms` — date selector responds, region
  select works, settings modal opens, dark mode persists.
- Check `lostarktimer.app/merchants` — WIP banner visible, schedule
  reference cards render, no console errors.
- Watch the next weekly run of the scraper workflow. First run
  should auto-PR a `data/data.json` update; merging that triggers a
  Vercel rebuild which regenerates `data/days/` and ships fresh
  schedule data.

## Rollback during prod incident

If the Vercel deploy is broken:

1. Vercel → project → Deployments → previous good deploy → Promote
   to Production. Buys time without a git revert.
2. Then `git revert <sha>` and push to `main` so the lockfile-of-
   record matches what's live.
