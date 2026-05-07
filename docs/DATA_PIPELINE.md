# Data pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│ Weekly cron (Mondays 10:00 UTC) — cwjoshuak/lostark-timers-scraper   │
│                                                                      │
│  1. fetch_with_retry(lostarkcodex.com/us/eventcalendar/)             │
│       30s timeout, 3 attempts w/ exponential backoff                 │
│  2. parse_calendar_html(html)                                        │
│       extracts calendar_data / calendar_events / calendar_msgs       │
│       raises ScrapeError on missing/malformed/unexpected shape       │
│  3. normalize(calendar_data)                                         │
│       midnight dedup + month rollover (April→May, Dec→Jan)           │
│  4. write_outputs (atomic .tmp → os.replace)                         │
│  5. pytest test/                                                     │
│       16 normalize cases + 16 scraper cases                          │
│  6. git diff data/                                                   │
│       skip if unchanged                                              │
│  7. commit + push to scraper repo's main                             │
│  8. checkout cwjoshuak/lostark-alarms via LOSTARK_ALARMS_TOKEN       │
│  9. fingerprint compare                                              │
│       skip PR if lostark-alarms data files match                     │
│ 10. cp data/{data,events,msgs}.json into target/data/                │
│ 11. open PR: chore(data): weekly schedule update                     │
│       PR body links the workflow run, doesn't name the source        │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ cwjoshuak/lostark-alarms (this repo) — PR review + merge             │
│                                                                      │
│  Review: spot-check date deltas; auto-merge later if patterns hold.  │
│  Merge → Vercel deploy → scripts/build-day-data.mjs runs as          │
│  prebuild → data/days/<m>-<d>.json regenerated → new chunks shipped. │
└──────────────────────────────────────────────────────────────────────┘
```

## Source

`https://lostarkcodex.com/us/eventcalendar/`. The page embeds three
JS variables in a `<script>`:

- `var calendar_data = { type: { month: { day: ... } } }`
- `var calendar_events = { id: [name, icon, ilevel] }`
- `var calendar_msgs = [{ idx: [type-name, type-icon] }, ...]`

The parser locates each by name (not by line index — the source
reordered them in 2023). Tolerates CRLF/LF endings.

## Why a private scraper repo

Privacy. The scraper code names the source domain and contains the
HTML-parsing selectors specific to it. Putting that in
`lostark-alarms` (public) would make it trivially reproducible.
Keeping it private means anyone wanting to mirror the data has to
reverse-engineer the parsing logic from the JS bundles in
`/_next/static/chunks`, which is much higher friction.

## Why normalize at scrape time, not display time

Two source-side bugs that the legacy code never fixed at the source:

- Midnight duplicates: redundant `0:00 0:00` rows (mixed
  `"0:00"` / `"00:00"` / `"0:00-0:00"` forms) sneak past a naive
  set-based dedup.
- Month rollover: when a week spans a month boundary, days 1–3 land
  under the previous month's bucket alongside days 27–30.

Fixing at scrape time means consumers see clean data and can iterate
the structure without re-implementing these heuristics.

## What `normalize.py` does

1. **`canonical_time(t)`** — `"9:5"` → `"09:05"`, single times expand
   to `"HH:MM-HH:MM"` so dedup compares apples to apples.
2. **`dedupe_midnight(times)`** — drops `"00:00-00:00"` markers when a
   real window exists for the same `(typeId, day, eventId)` tuple;
   keeps a single midnight only when it's the lone entry.
3. **`fix_month_rollover(by_type)`** — within a month bucket, if days
   `≤7` and `≥25` both appear, the low days are reassigned to
   `month + 1` (with year wraparound for Dec→Jan).
4. Recursive `_dedupe_times_in_place` walks both dict-shaped and
   list-shaped day buckets (type 2 emits a list). Crash-fixed in
   `fix(normalize): handle list-shaped day buckets`.

## What's intentionally NOT applied

The `+10 min` per-event-type adjustment described in
`docs/DECISIONS.md` (legacy code in `lostarktimer-utils/scraper.js`)
lives in `pages/alarms.tsx`, not in `normalize.py`. We keep it on the
consumer side so it can be flipped without re-running the pipeline.

## Failure modes

- **Network fails**: `fetch_with_retry` retries 3× with backoff. After
  exhaustion, raises `ScrapeError` and the action exits 1. No data
  files touched.
- **Source HTML restructure** (var renamed, script moved): parser
  raises with a clear message. Action fails. Committed data stays.
- **Malformed JSON in source**: same — `ScrapeError`. Action fails.
- **Network is fine but data didn't change**: `git diff` step skips
  the commit-back. PR step also fingerprint-skips. No empty PR.
- **Source emits a new event-type or event-id we haven't seen**:
  passes through normalize without complaint. The web app falls
  back to the metadata name from `data/events.json` (or the bare id
  if metadata is missing). No crash.

## Adding a new normalization rule

1. Add the function in `normalize.py`.
2. Wire it into `normalize()` between `fix_month_rollover` and
   `_dedupe_times_in_place`, or into the recursive walker.
3. Add pytest cases under `test/test_normalize.py`. Cover the happy
   case, the empty case, the no-op case, and the edge case the rule
   exists to handle.
4. Capture a fresh source-HTML fixture into
   `test/fixtures/calendar_script_real.txt` if the change is
   sensitive to source shape.

## Activating

See `docs/DEPLOY.md` § "Activating the data pipeline" for the
push + secret + workflow-run sequence. Until those happen the
pipeline is dormant — `data/data.json` updates require a manual
copy-and-PR.
