/**
 * These tests exercise the structural invariants of createTableData and the
 * className-by-diff behavior of generateTimestampStrings without rendering the
 * full GameEventTableCell tree (which depends on i18n + image contexts that
 * aren't worth scaffolding for a math/structure test).
 */
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { DateTime, Interval } from 'luxon'

vi.mock('../../../components/GameEventTableCell', () => ({
  default: ({ gameEvent }: any) => (
    <td data-testid="game-cell" data-uuid={gameEvent.uuid} />
  ),
}))
vi.mock('../../../components/MerchantTableCell', () => ({
  default: ({ merchant }: any) => (
    <td data-testid="merchant-cell" data-uuid={merchant.uuid} />
  ),
}))

import { createTableData, generateTimestampStrings } from '../../../util/createTableData'
import GameEvent from '../../../common/GameEvent'
import APIEventType from '../../../common/api/APIEventType'
import APIGameEvent from '../../../common/api/APIGameEvent'

const tz = 'America/New_York'
const at = (iso: string) => DateTime.fromISO(iso, { zone: tz })

const makeEvent = (id: string) => {
  const et = new APIEventType(0, 'Boss', 'icon.webp')
  const ge = new APIGameEvent(id, `Event ${id}`, 'achieve.webp', 250)
  return new GameEvent(et, ge)
}

const renderRows = (events: GameEvent[]) => {
  const rows = createTableData({
    events,
    serverTime: at('2026-05-06T10:00'),
    currDate: at('2026-05-06T10:00'),
    viewLocalizedTime: false,
    view24HrTime: false,
    isGameEvent: true,
  })
  const { container } = render(
    <table>
      <tbody>{rows}</tbody>
    </table>
  )
  return container.querySelectorAll('tr')
}

describe('createTableData', () => {
  describe('row pairing', () => {
    it('returns no rows for an empty input', () => {
      expect(renderRows([])).toHaveLength(0)
    })

    it('pairs two events into a single row with two cells', () => {
      const rows = renderRows([makeEvent('a'), makeEvent('b')])
      expect(rows).toHaveLength(1)
      expect(rows[0].children).toHaveLength(2)
      expect(rows[0].querySelectorAll('[data-testid="game-cell"]')).toHaveLength(2)
    })

    it('pads a single event with one invisible cell', () => {
      const rows = renderRows([makeEvent('a')])
      expect(rows).toHaveLength(1)
      expect(rows[0].children).toHaveLength(2)
      expect(rows[0].querySelectorAll('[data-testid="game-cell"]')).toHaveLength(1)
      // The padding cell uses the "invisible" Tailwind class
      const cells = Array.from(rows[0].children)
      const padded = cells.find((c) => c.className.includes('invisible'))
      expect(padded).toBeDefined()
    })

    it('splits 3 events into 2 rows, second row padded', () => {
      const rows = renderRows([makeEvent('a'), makeEvent('b'), makeEvent('c')])
      expect(rows).toHaveLength(2)
      expect(rows[0].querySelectorAll('[data-testid="game-cell"]')).toHaveLength(2)
      expect(rows[1].querySelectorAll('[data-testid="game-cell"]')).toHaveLength(1)
    })

    it('splits 4 events into 2 full rows', () => {
      const rows = renderRows([
        makeEvent('a'),
        makeEvent('b'),
        makeEvent('c'),
        makeEvent('d'),
      ])
      expect(rows).toHaveLength(2)
      rows.forEach((r) =>
        expect(r.querySelectorAll('[data-testid="game-cell"]')).toHaveLength(2)
      )
    })
  })
})

describe('generateTimestampStrings', () => {
  const dummyEvent = (() => {
    const e = makeEvent('x')
    e.times = [
      Interval.fromDateTimes(at('2026-05-06T10:00'), at('2026-05-06T10:30')),
    ]
    return e
  })()

  const intervalAt = (startISO: string, endISO: string) =>
    Interval.fromDateTimes(at(startISO), at(endISO))

  const renderStrip = (interval: Interval, serverTime: DateTime) => {
    const node = generateTimestampStrings(
      dummyEvent,
      interval,
      serverTime,
      serverTime.zone,
      true, // 24h time so the renderer is deterministic
      0
    )
    const { container } = render(<>{node}</>)
    return container
  }

  it('marks past intervals with the past-color class', () => {
    const c = renderStrip(
      intervalAt('2026-05-06T09:00', '2026-05-06T09:30'),
      at('2026-05-06T10:00')
    )
    const span = c.querySelector('span > span')
    expect(span?.className).toMatch(/text-muted-foreground/)
  })

  it('marks intervals starting within 15 minutes with the imminent-color class', () => {
    const c = renderStrip(
      intervalAt('2026-05-06T10:10', '2026-05-06T10:30'),
      at('2026-05-06T10:00')
    )
    const span = c.querySelector('span > span')
    expect(span?.className).toMatch(/text-amber-500/)
  })

  it('marks an in-progress interval with the imminent-color class', () => {
    const c = renderStrip(
      intervalAt('2026-05-06T09:55', '2026-05-06T10:25'),
      at('2026-05-06T10:00')
    )
    const span = c.querySelector('span > span')
    expect(span?.className).toMatch(/text-amber-500/)
  })

  it('marks distant-future intervals with the upcoming-color class', () => {
    const c = renderStrip(
      intervalAt('2026-05-06T14:00', '2026-05-06T14:30'),
      at('2026-05-06T10:00')
    )
    const span = c.querySelector('span > span')
    expect(span?.className).toMatch(/text-emerald-600/)
  })
})
