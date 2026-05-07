# Architecture

## Runtime data flow — `/alarms`

```
┌─────────────────────────────────────────────────────────────────────┐
│ Build time                                                          │
│                                                                     │
│  data/data.json  ──┐                                                │
│                    ├──► scripts/build-day-data.mjs (npm prebuild)   │
│  data/events.json ─┘                                                │
│                          │                                          │
│                          ▼                                          │
│                    data/days/<m>-<d>.json   (gitignored)            │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ (each file becomes a webpack chunk
                            │  via templated dynamic import)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Browser (pages/alarms.tsx)                                          │
│                                                                     │
│  1. Component mount                                                 │
│  2. useLocalStorage hook resolves regionTZ / regionTZName /         │
│     viewLocalizedTime / view24HrTime / etc.                         │
│  3. selectedDate = currDate.setZone(regionTZ)                       │
│  4. loadDayData(selectedDate.month, selectedDate.day)               │
│       └─ dynamic import('../data/days/<m>-<d>.json')                │
│            ├─ resolved: { type: <ilvl-or-list> } for that day       │
│            └─ rejected: {} (empty-state renders)                    │
│  5. Build GameEvent[] for the day                                   │
│       └─ +10 min adjustment for sailing-style ids (both start/end)  │
│  6. generateEventsTable splits into "imminent" + "rest" tables      │
│  7. Render <GameEventTableCell> per event                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Per-day chunking, in detail

Source `data/data.json` shape:
```jsonc
{
  "0": {           // event-type id
    "5": {         // month
      "9": {       // day
        "":  {     // item-level (often empty string)
          "4001": ["14:00-17:00", "20:00-23:00"]
          //       └─ "HH:MM-HH:MM" ranges (canonicalised by normalize.py)
        }
      }
    }
  },
  "2": {
    "5": {
      "9": [        // type 2 emits a LIST at the day level
        { "1101": ["00:50-00:50", ...] },
        { "1102": ["00:50-00:50", ...] }
      ]
    }
  }
}
```

`scripts/build-day-data.mjs` reshapes per (month, day):
```jsonc
// data/days/5-9.json
{
  "0": { "": { "4001": ["14:00-17:00", "20:00-23:00"] } },
  "2": [{ "1101": [...] }, { "1102": [...] }]
}
```

The alarms page uses a templated dynamic import:
```ts
import(/* webpackChunkName: "alarms-day-[request]" */
  `../data/days/${month}-${day}.json`)
```

Webpack scans `data/days/*.json` at build time and emits one
fingerprinted chunk per file. Chunks are served at non-stable URLs
(hash changes per deploy), so they're not trivially scrapable —
unlike a `/public/data/data.json` which would be a single curl.

## Theme system

| Concern                | Mechanism                                              |
|------------------------|--------------------------------------------------------|
| Light vs. dark         | `class="dark"` on `<html>`                             |
| Pre-hydration          | Inline script in `pages/_document.tsx` reads localStorage |
| User toggle            | Modal `Dark Mode` checkbox → `useLocalStorage` setter → effect adds/removes `.dark` |
| Cross-tab/cross-instance | `useLocalStorage` dispatches a custom event on every set |
| Tailwind dark variant  | `@custom-variant dark (&:is(.dark *))` in `globals.css` |
| Color tokens           | shadcn CSS variables for both modes; `bg-card`, `text-foreground`, etc. |

Three-level surface hierarchy in light mode (so cards/dropdowns/modals
visibly stack):
- `--background` — page (~oklch 0.94, faint blue tint)
- `--card` / `--popover` — elevated surface (~oklch 0.99)
- `--secondary` / `--muted` — between (button rests, inputs)

Dark mode keeps shadcn defaults — cards already lighter than page bg.

## i18n

- All translations bundled in `util/i18n.ts` (no async load)
- EN translations in `public/locales/en/*` are mostly stale; cell
  rendering prefers `gameEvent.gameEvent.name` (from `data/events.json`)
  when the language is EN, and falls back to i18n only for ZH or when
  metadata is missing
- `i18n.changeLanguage` rather than Next router locale (Next 16
  removed the i18n routing config)

## Modal pattern

```
<Dialog open={open} onOpenChange={setOpen}>     ← state lives in page
  <DialogContent>                               ← use bg-card
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
      <DialogDescription className="sr-only">   ← required by Radix
        ...
      </DialogDescription>
    </DialogHeader>
    ...
    <DialogFooter>
      <DialogClose asChild>
        <Button>All Done!</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

The page (or `_app.tsx` for cross-page modals) owns `[open, setOpen]`
and renders the modal alongside its trigger. No checkbox-toggle
pattern. The full Row inside settings modals is a `<Label htmlFor>` so
clicks anywhere on the row toggle the input.

## Region/server topology

Three regions post-2024 server merges, sourced from
[Xeio/WanderLost](https://github.com/Xeio/WanderLost):

| Display name | IANA timezone           | Servers                                       |
|--------------|-------------------------|-----------------------------------------------|
| NA East      | `America/New_York`      | Balthorr, Inanna, Luterra, Nineveh, Vairgrys  |
| NA West      | `America/Los_Angeles`   | Brelshaza, Thaemine                           |
| EU Central   | `Europe/Warsaw`         | Arcturus, Elpon, Gienah, Ortuus, Ratik        |

`util/static.ts` `resolveRegion(stored)` migrates legacy localStorage
values (`US East`, `US West`, `EU West`, `South America`) to the
closest live region so returning users don't see an empty select.
