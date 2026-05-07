import '@testing-library/jest-dom/vitest'

// Node 22+ ships an experimental Storage API on globalThis that shadows
// jsdom's. Vitest's populateGlobal skips `localStorage`/`sessionStorage`
// because they're not in its hardcoded KEYS list — so when Node has a
// builtin, jsdom's never reaches the test. Force jsdom's onto globalThis.
const jsdom = (globalThis as unknown as { jsdom?: { window: Window } }).jsdom
if (jsdom?.window) {
  for (const key of ['localStorage', 'sessionStorage'] as const) {
    Object.defineProperty(globalThis, key, {
      value: jsdom.window[key],
      configurable: true,
      writable: true,
    })
  }
}
