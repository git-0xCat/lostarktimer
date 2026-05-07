import type { RegionKey } from '../../util/types/types'

type EventMap = {
  region_change: { from: RegionKey | 'unset'; to: RegionKey }
  date_change: { direction: 'prev' | 'next' | 'today'; daysFromToday: number }
  event_disable: {
    eventId: string
    duration:
      | 'once'
      | '12hr'
      | 'daily-reset'
      | 'weekly-reset'
      | 'three-weeks'
  }
  event_enable: { eventId: string }
  group_repeats_toggle: { enabled: boolean; source: 'cell' | 'settings' }
  dark_mode_toggle: { enabled: boolean }
  view_24hr_toggle: { enabled: boolean }
  localized_time_toggle: { enabled: boolean }
  hide_disabled_toggle: { enabled: boolean }
  move_disabled_bottom_toggle: { enabled: boolean }
  desktop_notifications_toggle: {
    enabled: boolean
    permission: 'granted' | 'denied' | 'default'
  }
  notify_minutes_change: { minutes: number }
  alert_sound_change: { sound: string }
  volume_change: { bucket: 'low' | 'mid' | 'high' }
  reset_disabled_alarms: undefined
  changelog_open: undefined
  github_modal_open: undefined
  alarm_triggered: { eventId: string; notifyMinutes: number }
}

export type TrackEvent = keyof EventMap

declare global {
  interface Window {
    umami?: {
      track: (event: string, props?: Record<string, unknown>) => void
    }
  }
}

export function track<E extends TrackEvent>(
  event: E,
  ...args: EventMap[E] extends undefined ? [] : [props: EventMap[E]]
): void {
  if (typeof window === 'undefined') return
  window.umami?.track(event, args[0] as Record<string, unknown> | undefined)
}

export const volumeBucket = (v: number): 'low' | 'mid' | 'high' =>
  v < 0.33 ? 'low' : v < 0.66 ? 'mid' : 'high'
