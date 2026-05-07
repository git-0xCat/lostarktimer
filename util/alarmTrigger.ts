import { DateTime, Interval } from 'luxon'

export interface AlarmEventLike {
  disabled: DateTime | null
  latest(t: DateTime): Interval | undefined
}

export const isWithinNotifyWindow = (
  event: AlarmEventLike,
  serverTime: DateTime,
  notifyWindowMs: number
): boolean => {
  if (event.disabled) return false
  const next = event.latest(serverTime)
  if (!next) return false
  if (!next.start) return false
  const diff = next.start.diff(serverTime).valueOf()
  return diff >= 0 && diff <= notifyWindowMs
}
