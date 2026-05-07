# 0018: Force jsdom's `localStorage` onto `globalThis` in `vitest.setup.ts`

**Status:** Accepted
**Date:** 2026-05-07

## Context

`npm run test` was failing 9/32 with `TypeError: window.localStorage.clear is
not a function` even though jsdom's own `localStorage` worked when accessed
via `window.jsdom.window.localStorage`.

Two compounding causes:

1. **Node 22+ ships an experimental `localStorage` on `globalThis`** that
   shadows jsdom's. Without `--localstorage-file <path>`, it's a degraded
   plain-`Object` Storage that has no `clear` / `setItem` methods. (The
   `.nvmrc` here pins Node 22; the dev was on 25 when this surfaced.)
2. **Vitest's `populateGlobal` doesn't include `localStorage` in its
   hardcoded keys list.** The filter says: if a key already exists on
   `global`, only override it if it's in the keys list. Node's builtin
   wins by default.

Confirmed via probe test: `window.localStorage` returned a plain `{}`
while `window.jsdom.window.localStorage` was a proper Storage instance.

## Decision

In `vitest.setup.ts`, after env init, force-assign jsdom's storage onto
`globalThis`:

```ts
const jsdom = (globalThis as { jsdom?: { window: Window } }).jsdom
if (jsdom?.window) {
  for (const key of ['localStorage', 'sessionStorage'] as const) {
    Object.defineProperty(globalThis, key, {
      value: jsdom.window[key],
      configurable: true,
      writable: true,
    })
  }
}
```

Works on any Node version regardless of whether the builtin Storage exists.

Also pinned `jsdom` from `"latest"` to `"^26.1.0"`. `latest` had drifted to
29.x; pinning prevents future jsdom upgrades from re-breaking tests
silently.

## Why not just upgrade Vitest

Vitest 4.1.5's `populateGlobal` issue isn't a fixed-by-version problem —
the keys list is curated and `localStorage` isn't on it. Upstream may add
it later; until they do, our setup-file shim is the load-bearing fix.

## Do not revert

- Don't remove the `vitest.setup.ts` shim without first verifying Node's
  builtin `localStorage` no longer shadows jsdom's. (Run the project on
  Node 22+ and confirm `npm run test` is green.)
- Don't relax `jsdom` back to `"latest"`.
