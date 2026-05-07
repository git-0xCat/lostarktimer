import { describe, it, expect } from 'vitest'
import { DateTime, Interval } from 'luxon'
import GameEvent from '../../../common/GameEvent'
import APIEventType from '../../../common/api/APIEventType'
import APIGameEvent from '../../../common/api/APIGameEvent'

const tz = 'America/New_York'

const makeInterval = (startISO: string, endISO: string) =>
  Interval.fromDateTimes(
    DateTime.fromISO(startISO, { zone: tz }),
    DateTime.fromISO(endISO, { zone: tz })
  )

const makeEvent = () => {
  const et = new APIEventType(0, 'Boss', 'icon.webp')
  const ge = new APIGameEvent('4005', 'Proving Grounds', 'achieve.webp', 250)
  return new GameEvent(et, ge)
}

describe('GameEvent', () => {
  describe('latest()', () => {
    it('returns the first interval that starts strictly after the given time', () => {
      const evt = makeEvent()
      evt.addTime(makeInterval('2026-05-06T10:00', '2026-05-06T10:30'))
      evt.addTime(makeInterval('2026-05-06T14:00', '2026-05-06T14:30'))
      evt.addTime(makeInterval('2026-05-06T18:00', '2026-05-06T18:30'))

      const now = DateTime.fromISO('2026-05-06T11:00', { zone: tz })
      const next = evt.latest(now)

      expect(next.start?.toISO()).toBe(
        DateTime.fromISO('2026-05-06T14:00', { zone: tz }).toISO()
      )
    })

    it('skips intervals that have already started, even if not yet ended', () => {
      const evt = makeEvent()
      evt.addTime(makeInterval('2026-05-06T10:00', '2026-05-06T12:00'))
      evt.addTime(makeInterval('2026-05-06T14:00', '2026-05-06T14:30'))

      const now = DateTime.fromISO('2026-05-06T11:00', { zone: tz })
      const next = evt.latest(now)

      expect(next.start?.toISO()).toBe(
        DateTime.fromISO('2026-05-06T14:00', { zone: tz }).toISO()
      )
    })

    it('returns undefined when no future interval exists', () => {
      const evt = makeEvent()
      evt.addTime(makeInterval('2026-05-06T08:00', '2026-05-06T08:30'))

      const now = DateTime.fromISO('2026-05-06T10:00', { zone: tz })
      expect(evt.latest(now)).toBeUndefined()
    })

    it('returns undefined for an event with no times', () => {
      const evt = makeEvent()
      const now = DateTime.fromISO('2026-05-06T10:00', { zone: tz })
      expect(evt.latest(now)).toBeUndefined()
    })

    it('treats an interval starting exactly at now as not-yet-started', () => {
      const evt = makeEvent()
      const now = DateTime.fromISO('2026-05-06T10:00', { zone: tz })
      evt.addTime(Interval.fromDateTimes(now, now.plus({ minutes: 30 })))
      evt.addTime(makeInterval('2026-05-06T14:00', '2026-05-06T14:30'))

      // diff(now).valueOf() > 0 is the gate, so an interval starting exactly at now is skipped
      const next = evt.latest(now)
      expect(next.start?.toISO()).toBe(
        DateTime.fromISO('2026-05-06T14:00', { zone: tz }).toISO()
      )
    })
  })

  describe('addTime()', () => {
    it('appends intervals in insertion order', () => {
      const evt = makeEvent()
      const a = makeInterval('2026-05-06T10:00', '2026-05-06T10:30')
      const b = makeInterval('2026-05-06T14:00', '2026-05-06T14:30')
      evt.addTime(a)
      evt.addTime(b)
      expect(evt.times).toEqual([a, b])
    })
  })

  describe('uuid', () => {
    it('assigns a unique uuid to each instance', () => {
      const a = makeEvent()
      const b = makeEvent()
      expect(a.uuid).not.toBe(b.uuid)
      expect(a.uuid).toMatch(/^[0-9a-f-]+$/i)
    })
  })
})
