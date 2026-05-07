import { describe, it, expect } from 'vitest'
import { DateTime, Duration, Interval } from 'luxon'
import { isWithinNotifyWindow, AlarmEventLike } from '../../../util/alarmTrigger'

const tz = 'America/New_York'
const at = (iso: string) => DateTime.fromISO(iso, { zone: tz })

const eventStartingAt = (iso: string, durationMin = 30): AlarmEventLike => {
  const start = at(iso)
  const end = start.plus({ minutes: durationMin })
  return {
    disabled: null,
    latest: () => Interval.fromDateTimes(start, end),
  }
}

describe('isWithinNotifyWindow', () => {
  const fiveMinMs = Duration.fromObject({ minutes: 5 }).toMillis()

  it('fires when event starts within the notify window', () => {
    const now = at('2026-05-06T10:00')
    const evt = eventStartingAt('2026-05-06T10:03')
    expect(isWithinNotifyWindow(evt, now, fiveMinMs)).toBe(true)
  })

  it('fires at the exact window boundary (diff == window)', () => {
    const now = at('2026-05-06T10:00')
    const evt = eventStartingAt('2026-05-06T10:05')
    expect(isWithinNotifyWindow(evt, now, fiveMinMs)).toBe(true)
  })

  it('fires at diff == 0 (event starting right now)', () => {
    const now = at('2026-05-06T10:00')
    const evt = eventStartingAt('2026-05-06T10:00')
    expect(isWithinNotifyWindow(evt, now, fiveMinMs)).toBe(true)
  })

  it('does not fire when event is past the window', () => {
    const now = at('2026-05-06T10:00')
    const evt = eventStartingAt('2026-05-06T10:06')
    expect(isWithinNotifyWindow(evt, now, fiveMinMs)).toBe(false)
  })

  it('does not fire when event is in the past (diff < 0)', () => {
    const now = at('2026-05-06T10:00')
    const evt: AlarmEventLike = {
      disabled: null,
      latest: () =>
        Interval.fromDateTimes(at('2026-05-06T09:55'), at('2026-05-06T10:25')),
    }
    expect(isWithinNotifyWindow(evt, now, fiveMinMs)).toBe(false)
  })

  it('does not fire when event has no upcoming interval', () => {
    const now = at('2026-05-06T10:00')
    const evt: AlarmEventLike = { disabled: null, latest: () => undefined }
    expect(isWithinNotifyWindow(evt, now, fiveMinMs)).toBe(false)
  })

  it('does not fire when event is disabled, even if otherwise eligible', () => {
    const now = at('2026-05-06T10:00')
    const base = eventStartingAt('2026-05-06T10:03')
    const evt: AlarmEventLike = { ...base, disabled: at('2026-12-31T23:59') }
    expect(isWithinNotifyWindow(evt, now, fiveMinMs)).toBe(false)
  })
})
