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

## Vercel environment variables

Set in Vercel → Project → Settings → Environment Variables. **All for
the Production environment only** (preview / development should leave
these unset so analytics dashboards stay clean).

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_UMAMI_SRC` | Umami analytics script URL |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami site ID |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (public, ships to client) |
| `SENTRY_ORG` | Sentry org slug — read by build plugin |
| `SENTRY_PROJECT` | Sentry project slug — read by build plugin |
| `SENTRY_AUTH_TOKEN` | Sentry build-plugin token for sourcemap upload |

`SENTRY_AUTH_TOKEN` should be rotated periodically (sentry.io →
Settings → Auth Tokens).

The Node.js Version setting under Vercel → Project → Settings → General
should be **22.x** to match `.nvmrc`.

## Watching prod

After merging:

- Check `lostarktimer.app/alarms` — date selector responds, region
  select works, settings modal opens, dark mode persists.
- Check `lostarktimer.app/merchants` — WIP banner visible, schedule
  reference cards render, no console errors.
- Sentry dashboard for any new error groups in the first 30 min.
- Umami dashboard to confirm pageviews are flowing.

## Rollback during prod incident

If the Vercel deploy is broken:

1. Vercel → project → Deployments → previous good deploy → Promote
   to Production. Buys time without a git revert.
2. Then `git revert <sha>` and push to `main` so the lockfile-of-
   record matches what's live.
