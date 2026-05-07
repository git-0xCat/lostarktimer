// Pre-build pass that splits data/data.json into per-day chunks the
// alarms page can dynamic-import on demand. Hooked into npm predev /
// prebuild so any `npm run dev` or `npm run build` regenerates the
// chunks from the latest committed data.json.
//
// Source shape:  { type: { month: { day: <ilvl-or-list> } } }
// Output shape:  { type: <ilvl-or-list> }   per   data/days/<month>-<day>.json
//
// The output dir is gitignored — these files are derivable from
// data/data.json and recreated on every build, so committing them
// would just be noise.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const SOURCE = path.join(repoRoot, 'data', 'data.json')
const OUT_DIR = path.join(repoRoot, 'data', 'days')

const data = JSON.parse(fs.readFileSync(SOURCE, 'utf8'))

/** @type {Record<string, Record<string, unknown>>} */
const byDay = {}

for (const [type, monthMap] of Object.entries(data)) {
  for (const [month, dayMap] of Object.entries(monthMap)) {
    for (const [day, payload] of Object.entries(dayMap)) {
      const key = `${month}-${day}`
      ;(byDay[key] ||= {})[type] = payload
    }
  }
}

fs.rmSync(OUT_DIR, { recursive: true, force: true })
fs.mkdirSync(OUT_DIR, { recursive: true })

for (const [key, content] of Object.entries(byDay)) {
  fs.writeFileSync(
    path.join(OUT_DIR, `${key}.json`),
    JSON.stringify(content)
  )
}

fs.writeFileSync(
  path.join(OUT_DIR, 'index.json'),
  JSON.stringify(Object.keys(byDay).sort())
)

console.log(
  `[build-day-data] wrote ${Object.keys(byDay).length} day files to data/days/`
)
