# Architectural decisions

A running log of non-obvious choices made during the 2026-05 revamp,
and *why*. Not exhaustive — only entries where someone reading the
code in 6 months might reasonably ask "why didn't they just X."

---

## Stack: Next 16 + shadcn (not v2 rewrite, not native)

We considered three directions: modernize the existing Next.js app,
pick up the abandoned `lostarktimer-v2` Next 13 + Supabase rewrite,
or rewrite as native iOS. Picked modernization because the goal was
to ship — the existing site is live on Vercel, the user is the only
maintainer, and we wanted a working production site fast. v2 was a
half-finished skeleton that would have meant rebuilding everything.
Native iOS is parked as a possible future.

DaisyUI 5 was kept briefly during the modernization because the
upgrade-then-redesign sequence was simpler. Once that landed we did
a clean rewrite to **shadcn/ui** (5-phase plan: scaffold → modals →
chrome → cells → polish) because the post-DaisyUI-5 visuals weren't
satisfying and the user wanted modern feel.

## Test ordering: tests first, then upgrade

The original plan was to lock current behavior in tests **before** the
sweeping dep upgrade so regressions would be caught. We ended up
collapsing some of this when the npm install happened to pull
Next 16 directly (the manifest had `"next": "latest"`), but the
principle held — every dep upgrade ran against the existing test
suite. The user's standing preference for revamps is "tests first";
saved as feedback memory.

## Data: bundled, not in `/public`

The cleaned schedule (`data/data.json` and friends) is the project's
value-add. Putting it under `/public` lets anyone curl
`https://lostarktimer.app/data/data.json` in one shot. Keep it
`require()`-ed / dynamic-`import()`-ed so it lives in fingerprinted
webpack chunks instead. Not real protection — anyone can dig into
the JS bundles — but raises the friction enough that casual scrapers
won't bother.

## Per-day chunking

`data/data.json` is ~76 KB raw / ~15 KB gzipped. It's loaded only on
`/alarms`, but every visit was paying the parse cost. A `prebuild`
pass splits it into `data/days/<m>-<d>.json` files (~5–8 KB each),
and the alarms page dynamic-imports just the visible day. We
considered:

- `getStaticProps` — embeds in HTML, doesn't really shrink anything
- `getServerSideProps` — no static URL but compute-per-request
- API route with auth — real protection but more infra
- Public static assets — defeats the "don't expose" goal

Templated dynamic imports were the cleanest middle ground. The
chunks are at hashed URLs that change per deploy; not stable enough
for casual scraping but accessible to a determined effort.

## i18n: bundled `react-i18next`, not `next-i18next`

`next-i18next` v16 was a near-total rewrite that no longer ships
the `useTranslation` / `serverSideTranslations` / `appWithTranslation`
helpers we used. Pinning to v15 also wasn't compatible with Next 16,
which removed the `i18n` config from `next.config.js` entirely. The
locale surface is small (EN + ZH, mostly UI labels), so we bundled
the translations directly via `util/i18n.ts` and `i18n.changeLanguage`
for switching. Locale routing (`/en/alarms` vs `/zh/alarms`) is gone;
that was a cosmetic feature nobody was using.

## Event labels: prefer `data/events.json` metadata over i18n

The hand-curated `public/locales/en/events.json` is stale (some
2-year-old strings disagreed with current names — e.g.
`[Assail]Preigelli-[Siege]-[Raid]Liebertane` vs. the cleaner
`[Siege] Preigelli VS. Liebertane`). Cell rendering now prefers the
metadata name from `data/events.json` (which is freshly scraped) and
falls back to i18n only for non-EN locales. ZH overrides keep working
via `public/locales/zh/`.

## `+10 min` adjustment: kept on, applied to both start AND end

The legacy code (`lostarktimer-utils/scraper.js`,
`lostarktimer-bot/index.js`) bumps certain type-IDs and event-IDs
forward by 10 min to match in-game spawn timing. The original
`pages/alarms.tsx` applied the bump only to start, then reconstructed
end from the source's end-hour string. That worked when the source
sent single times like `"2:00"` (the end-hour fallback used
`start.hour` after the bump). After `normalize.py` started
canonicalising single times to `"2:00-2:00"`, end was no longer
falling back, and applying +10 to only start produced `start=02:10`,
`end=02:00` — interval inverted.

We chose to keep the adjustment (it's been baked into the public
behavior for years) and apply +10 to both start AND end, matching the
legacy `lostarktimer-utils/scraper.js`. If users report sailing-event
times are 10 min off, drop the offset. Until then, no flip.

## Region migration: shim vs. drop legacy values

The localStorage key `regionTZName` may still hold a 2022-era value
(`US East`, `US West`, `EU West`, `South America`) for returning
users. `util/static.ts` `resolveRegion()` maps dead names to the
closest current region and the new `RegionTimeZoneMapping` keys are
the truth. Without the shim, returning users would see an empty
select on first visit. We chose this over silently clearing
localStorage so user theme/dark-mode/notify settings stay intact.

## Modals: controlled, page-owned state

DaisyUI's checkbox-toggle pattern (`<input type="checkbox" id=…>` +
`<label htmlFor>` triggers across components) was replaced with
controlled Radix `<Dialog>`. State lives in the page that triggers it:
`pages/_app.tsx` for ChangeLogModal + GitHubModal (triggered from the
SideBar component); `pages/alarms.tsx` and `pages/merchants.tsx` for
their own config modals. Prop-drilling `onOpen…` callbacks into
SideBar was simpler than introducing a context for two booleans.

## Theme: `class="dark"` only

DaisyUI used `data-theme="dark"`. shadcn uses `class="dark"`. We had
both during the migration. The pre-hydration script in `_document.tsx`
sets the class only — that's what shadcn's `@custom-variant` and the
Tailwind `dark:` selectors key off. Reading and writing both was
needless complexity.

## Merchants: parked behind WIP banner, websocket disconnected

`wss://ws.lostarktimer.app` was opened on every `/merchants` mount,
reconnected in dev, and pushed empty data into the table — it's
either dead or stale. With the page parked behind a clear "Work in
Progress: crowdsourced votes coming" banner, keeping the socket alive
was busy-work. We dropped both the socket effects and the
`socket.io-client` dep entirely. The static merchant data
(`data/merchants.json`, `data/merchantSchedules.json`) still feeds
the schedule reference cards. When crowdsourcing lands we'll add a
different transport.

## `--legacy-peer-deps`: dropped

Added during the React 17 → React 19 migration when peer-dep ranges
were inconsistent across `@testing-library/react`, `next-i18next`,
and Next 12. Once everything was on the modern lockfile, a clean
`npm install` resolved without it. Removed from the CI workflow too.

## Image transformation: drop `<Image>` for tiny icons

Next's `<Image>` component goes through Vercel's image-transformation
pipeline, which is metered. The icons we use are 20×20 and 38×38; any
"optimization" they get from the pipeline is negligible. Replaced
with plain `<img loading="lazy" decoding="async">`. Saves the entire
quota for this app.

## Scraper resiliency: fail loud, write atomically

`lostark-timers-scraper`'s `scraper.py` was a 79-line happy-path
script. Reshape:

- `fetch_with_retry` — 30s timeout, 3 attempts with exponential
  backoff. Survives transient network blips.
- `parse_calendar_html` — pure parser. Locates each var by name (the
  source has reordered them in the past), tolerates CRLF/LF endings,
  raises `ScrapeError` with a useful message on each failure mode.
- `write_outputs` — write to `.tmp`, then `os.replace`. A partial
  write can never corrupt the committed snapshot.
- Top-level `run()` exits 1 on `ScrapeError` so the GitHub Action
  reports a real failure instead of silently producing empty output.

If the source HTML structure shifts in a way the parser can't handle,
the action fails and emails — committed data stays intact.

## Spanning-midnight intervals

Some source windows cross midnight (`23:00-01:00`). The interval
builder constructs both endpoints on the same calendar day, so
`end < start` and `Interval.fromDateTimes` returns an invalid interval
(null start). The legacy code had a defensive filter on
`todayEvents` that quietly dropped these; with per-day chunking we
removed that filter. Roll `end` forward by a day when it'd land
before `start`. This wasn't a regression introduced by the chunking,
but it's now visible since the dropping-filter is gone.
