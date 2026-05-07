import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useState, useEffect, useRef } from 'react'
import { APIGameEvent, APIEventType } from '../common/api'
import { GameEvent } from '../common'
import AlarmConfigModal from '../components/modals/AlarmConfigModal'
import { DateTime, Duration, Interval } from 'luxon'
import useLocalStorage from '../util/useLocalStorage'
import { Howl, Howler } from 'howler'
import { alert1, alert2, alert3, alert4, alert5, alert6 } from '../sounds'
import { IconSettings } from '@tabler/icons-react'
import usePrevious from '../util/usePrevious'
import { createTableData } from '../util/createTableData'
import { RegionKey } from '../util/types/types'
import { RegionTimeZoneMapping, resolveRegion } from '../util/static'
import { isWithinNotifyWindow } from '../util/alarmTrigger'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type AlertSoundKeys =
  | 'Alert 1'
  | 'Alert 2'
  | 'Alert 3'
  | 'Alert 4'
  | 'Alert 5'
  | 'Alert 6'
type eventName = string
type iconUrl = string
type iLvlInt = number
type eventId = string

type EventIdMapping = [
  id: eventId,
  mapping: [name: eventName, icon: iconUrl, iLvl: iLvlInt]
]
type EventTypeIconMapping = [eventType: string, eventIconUrl: string]

type EventsJson = Record<string, [string, string, number | null]>
type MsgsJson = [Record<string, [string, string]>, ...unknown[]]

const buildEventMapping = (events: EventsJson): APIGameEvent[] =>
  Object.entries(events).map((e) => {
    const [id, [name, url, iLvl]] = e as EventIdMapping
    return new APIGameEvent(id, name, url, iLvl)
  })

const buildGroupedEvents = (mapping: APIGameEvent[]) => ({
  'Arkesia Grand Prix': mapping
    .filter(({ name }) => name.includes('Grand Prix'))
    .map((e) => e.id),
  'Field Bosses': mapping
    .filter(({ iconUrl }) => iconUrl === 'achieve_14_142.webp')
    .map((e) => e.id),
  'Chaos Gates': mapping
    .filter(({ iconUrl }) => iconUrl === 'achieve_13_11.webp')
    .sort((a, b) => b.minItemLevel - a.minItemLevel)
    .map((e) => e.id),
  'Ghost Ships': mapping
    .filter(({ name }) => name.includes('Ghost Ship'))
    .map((e) => e.id),
})

const buildEventTypeMapping = (msgs: MsgsJson): APIEventType[] =>
  Object.entries(msgs[0]).map(([idx, e]) => {
    const [name, url] = e as EventTypeIconMapping
    return new APIEventType(Number(idx), name, url)
  })

const sounds = {
  'Alert 1': alert1,
  'Alert 2': alert2,
  'Alert 3': alert3,
  'Alert 4': alert4,
  'Alert 5': alert5,
  'Alert 6': alert6,
}

const Alarms: NextPage = () => {
  const { t } = useTranslation('events')
  const [currDate, setCurrDate] = useState<DateTime>(DateTime.now())

  // Lazy-load the event/message JSON instead of bundling them. The three
  // files together are ~80 KB raw and used only on this page; fetching
  // them at runtime keeps them out of the initial JS chunk and lets the
  // browser cache them independently of the JS deploy.
  const [allEventData, setAllEventData] = useState<
    Record<string, any> | null
  >(null)
  const [eventIDNameMapping, setEventIDNameMapping] = useState<
    APIGameEvent[]
  >([])
  const [eventTypeIconMapping, setEventTypeIconMapping] = useState<
    APIEventType[]
  >([])
  const [groupedEvents, setGroupedEvents] = useState<
    Record<string, string[]>
  >({})

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/data/data.json').then((r) => r.json()),
      fetch('/data/events.json').then((r) => r.json()),
      fetch('/data/msgs.json').then((r) => r.json()),
    ])
      .then(([data, events, msgs]) => {
        if (cancelled) return
        setAllEventData(data)
        const mapping = buildEventMapping(events as EventsJson)
        setEventIDNameMapping(mapping)
        setGroupedEvents(buildGroupedEvents(mapping))
        setEventTypeIconMapping(buildEventTypeMapping(msgs as MsgsJson))
      })
      .catch((err) => {
        console.error('Failed to load event data:', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const [regionTZ, setRegionTZ] = useLocalStorage<string>(
    'regionTZ',
    RegionTimeZoneMapping['NA East']
  )
  const [regionTZName, setRegionTZName] = useLocalStorage<RegionKey>(
    'regionTZName',
    'NA East'
  )
  const isMounted = useRef(false)
  const defaultTheme = (): boolean => {
    // Defaults to system theme if unconfigured
    return Boolean(
      localStorage.getItem('darkMode') ||
      (window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    )
  }
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(
    'darkMode',
    defaultTheme
  )
  useEffect(() => {
    //Prevents FoUC (Flash of Unstylized Content) by not refreshing on first mount
    if (!isMounted.current) {
      isMounted.current = true
      return
    }

    document.documentElement.classList.toggle('dark', !!darkMode)
  }, [darkMode])

  const [serverTime, setServerTime] = useState<DateTime>(
    currDate.setZone(regionTZ)
  )
  const [selectedDate, setSelectedDate] = useState(currDate.setZone(regionTZ))

  const [gameEvents, setGameEvents] = useState<Array<GameEvent> | undefined>(
    undefined
  )
  const [todayEvents, setTodayEvents] = useState<Array<GameEvent>>([])
  const [fullEventsTable, setFullEventsTable] = useState<Array<React.JSX.Element>>([])
  const [currentEventsTable, setCurrentEventsTable] = useState<
    Array<React.JSX.Element>
  >([])

  const [selectedEventType, setSelectedEventType] = useState(-1)
  const [viewLocalizedTime, setViewLocalizedTime] = useLocalStorage<boolean>(
    'viewLocalizedTime',
    true
  )
  const [view24HrTime, setView24HrTime] = useLocalStorage<boolean>(
    'view24HrTime',
    false
  )
  const [notifyInMins, setNotifyInMins] = useLocalStorage<number>(
    'notifyInMins',
    15
  )
  const [alertSound, setAlertSound] = useLocalStorage<string>(
    'alertSound',
    'muted'
  )
  const [disabledAlarms, setDisabledAlarms] = useLocalStorage<{
    [key: string]: number
  }>('disabledAlarms', {})
  const [desktopNotifications, setDesktopNotifications] =
    useLocalStorage<boolean>('desktopNotifications', false)
  const [hideGrandPrix, setHideGrandPrix] = useLocalStorage<boolean>(
    'hideGrandPrix',
    false
  )
  const [unlockedAudio, setUnlockedAudio] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [moveDisabledEventsBottom, setMoveDisabledEventsBottom] =
    useLocalStorage<boolean>('moveDisabledEventsBottom', false)
  const [hideDisabledEvents, setHideDisableEvents] = useLocalStorage<boolean>(
    'hideDisabledEvents',
    false
  )
  const [mounted, setMounted] = useState(false)
  const [volume, setVolume] = useLocalStorage<number>('volume', 0.4)
  const buttons = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ]

  useEffect(() => {
    if (regionTZ !== undefined) {
      setMounted(true)
      setServerTime(currDate.setZone(regionTZ))
      setSelectedDate(currDate.setZone(regionTZ))
    }
  }, [regionTZ])

  useEffect(() => {
    if (volume !== undefined) Howler.volume(volume)
  }, [volume])

  useEffect(() => {
    setMounted(true)
    Howler.autoSuspend = false
  }, [])
  useEffect(() => {
    const timer = setInterval(() => {
      let now = DateTime.now()
      if (currDate.endOf('day').diffNow().toMillis() < 0) setSelectedDate(now)
      setCurrDate(now)
      setServerTime(now.setZone(regionTZ))
    }, 1000)
    return () => {
      clearInterval(timer) // Return a function to clear the timer so that it will stop being called on unmount
    }
  }, [regionTZ, view24HrTime, viewLocalizedTime, selectedDate])

  // clear disabled alarm when alarm expires
  useEffect(() => {
    if (disabledAlarms) {
      let keys = Object.keys(disabledAlarms)
      keys.forEach((key) => {
        if (disabledAlarms[key] < DateTime.now().toMillis()) {
          delete disabledAlarms[key]
        }
      })
      setDisabledAlarms(disabledAlarms)
    }
  }, [serverTime.minute])
  // read and populate all game events
  useEffect(() => {
    if (!mounted || regionTZ === undefined || !allEventData) return
    let gameEvents: Array<GameEvent> = []
    let disabledAlarmsKeys = Object.keys(disabledAlarms || {})
    Object.entries(allEventData).forEach((eventType) => {
      const [type, monthDayMap] = eventType as [string, any]
      let et = eventTypeIconMapping.find((et) => et.id.toString() === type)
      if (!et) return
      for (const [month, days] of Object.entries(monthDayMap) as [
        string,
        any
      ]) {
        for (const [day, events] of Object.entries(days) as [string, any]) {
          for (const [iLvl, event] of Object.entries(events) as [string, any]) {
            for (const [eventId, eventTime] of Object.entries(event) as [
              string,
              any
            ]) {
              let gt = eventIDNameMapping.find((gt) => gt.id === eventId)
              if (!gt) continue

              let gameEvent = new GameEvent(et, gt)
              eventTime.forEach((time: string, idx: number) => {
                const [startTime, endTime] = time.split('-')
                const [startHr, startMin] = startTime.split(':')
                const [endHr, endMin] = endTime?.split(':') ?? ['', '']
                let start = DateTime.fromObject(
                  {
                    year: currDate.year,
                    month: Number(month),
                    day: Number(day),
                    hour: Number(startHr),
                    minute: Number(startMin),
                  },
                  { zone: regionTZ }
                )
                let id = Number(gt.id)
                if (
                  (7000 <= id && id < 8000 && ![7013, 7035].includes(id)) ||
                  [
                    1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010,
                    5002, 5003, 5004, 5005, 6007, 6008, 6009, 6010, 6011,
                  ].includes(id)
                ) {
                  start = start.plus({ minutes: 10 })
                }
                let end = DateTime.fromObject(
                  {
                    year: start.year,
                    month: start.month,
                    day: start.day,
                    hour: Number(endHr != '' ? endHr : start.hour),
                    minute: Number(endMin != '' ? endMin : start.minute),
                  },
                  { zone: regionTZ }
                )

                gameEvent.addTime(Interval.fromDateTimes(start, end))
                if (
                  disabledAlarmsKeys.includes(gameEvent.gameEvent.id) &&
                  disabledAlarms
                )
                  gameEvent.disabled =
                    DateTime.fromMillis(
                      disabledAlarms[gameEvent.gameEvent.id]
                    ) || null
              })
              gameEvents.push(gameEvent)
            }
          }
        }
      }
    })

    const todayEvents = gameEvents.filter(
      (ge) =>
        ge.times.find((t) => {
          return t.start && t.start.day === selectedDate.day
        }) !== undefined &&
        ge.times.length &&
        ge.times.at(0)?.start?.day === selectedDate.day &&
        (ge.times.at(-1)?.start?.day === selectedDate.plus({ days: 1 }).day ||
          ge.times.at(-1)?.start?.day === selectedDate.day)
    )

    setGameEvents(gameEvents)
    setTodayEvents(todayEvents)
  }, [
    regionTZ,
    selectedDate,
    viewLocalizedTime,
    view24HrTime,
    allEventData,
    eventTypeIconMapping,
    eventIDNameMapping,
  ])

  // (re)generate full events table and current events table on dependency array change (mostly config changes)
  useEffect(() => {
    if (mounted) {
      generateEventsTable(selectedEventType)
    }
  }, [
    serverTime.minute,
    notifyInMins,
    disabledAlarms,
    hideGrandPrix,
    moveDisabledEventsBottom,
    hideDisabledEvents,
    todayEvents,
    selectedEventType,
  ])
  // game event button click (filters events by type)
  const buttonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: number
  ) => {
    setSelectedEventType(id)
  }

  const generateEventsTable = (eventType: number) => {
    // let allEvents: Array<GameEvent> = []
    let ms = Duration.fromObject({ minutes: notifyInMins }).toMillis()
    let disabledAlarmsKeys = Object.keys(disabledAlarms || {})

    let currEventsTable: Array<GameEvent> = []
    let allEventsTable: Array<GameEvent> = []

    for (let i = 0; i < todayEvents?.length; i++) {
      let event = todayEvents[i]
      if (eventType !== -1 && event.eventType.id !== eventType) continue
      if (disabledAlarmsKeys.includes(event.gameEvent.id) && disabledAlarms)
        event.disabled =
          DateTime.fromMillis(disabledAlarms[event.gameEvent.id]) || null
      else event.disabled = null

      if (event.disabled && hideDisabledEvents) continue
      else if (event.disabled && moveDisabledEventsBottom) {
        allEventsTable.push(event)
        continue
      }

      if (hideGrandPrix) {
        const group = Object.entries(groupedEvents)
          .map(([name, ids]) => ({
            idx: ids.indexOf(event.gameEvent.id),
            name,
          }))
          .filter(({ idx }) => idx >= 0)[0]
        if (group) {
          if (group.idx > 0) continue
          event.groupName = group.name
        }
      }

      if (isWithinNotifyWindow(event, serverTime, ms)) {
        currEventsTable.push(event)
      } else {
        allEventsTable.push(event)
      }
    }

    allEventsTable = allEventsTable.sort((a, b) => {
      if (moveDisabledEventsBottom) {
        if (a.disabled) return Number.POSITIVE_INFINITY
        else if (b.disabled) return Number.NEGATIVE_INFINITY
      }

      let finalCmp = 0
      let aTime = a.latest(serverTime)
      let bTime = b.latest(serverTime)
      if (aTime && bTime) {
        let aTime = a.latest(serverTime).start!.diff(serverTime).valueOf()
        let bTime = b.latest(serverTime).start!.diff(serverTime).valueOf()

        if (aTime < bTime) {
          finalCmp = -1
        } else if (aTime - bTime < 1000) {
          finalCmp = a.gameEvent.minItemLevel - b.gameEvent.minItemLevel
        } else {
          finalCmp = 1
        }
      } else if (aTime) {
        finalCmp = -1
      } else if (bTime) {
        finalCmp = 1
      } else {
        finalCmp = a.gameEvent.minItemLevel - b.gameEvent.minItemLevel
      }
      return finalCmp
    })
    currEventsTable = currEventsTable.sort(
      (a, b) =>
        a.latest(serverTime).start!.valueOf() -
        b.latest(serverTime).start!.valueOf()
    )
    const currentEventsTableData = createTableData({
      events: currEventsTable,
      serverTime,
      currDate,
      viewLocalizedTime: viewLocalizedTime || false,
      view24HrTime: view24HrTime || false,
      isGameEvent: true,
    })

    if (
      currentEventsTableData.length > 0 &&
      currentEventsTableData.length > currentEventsTable.length &&
      (currentEventsTable.length !== 0 ||
        currentEventsTableData !== currentEventsTable)
    ) {
      if (alertSound && alertSound !== 'muted') {
        let s = new Howl({
          src: sounds[alertSound as AlertSoundKeys] as unknown as string,
          onunlock: (id) => setUnlockedAudio(true),
        })
        s.play()
      }
      if (desktopNotifications) {
        let notification = new Notification(
          `${t('alarms:notification.heading', { notifyInMins })}`,
          {
            body: currEventsTable
              .map((e) => t(`${e.gameEvent.id}`))
              .reduce((acc, curr, currIndex) => {
                if (currIndex < 3) {
                  return `${acc}\n${curr}`
                } else if (currIndex === 3) {
                  const additionalEvents: number = currEventsTable.length - 3
                  return `${acc}\n${t('alarms:notification.additional-events', {
                    additionalEvents,
                  })}`
                } else {
                  return acc
                }
              }, ''),
            icon: '/images/LA_Mokko_Seed.png',
          }
        )
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      }
    }

    setFullEventsTable(
      createTableData({
        events: allEventsTable,
        serverTime,
        currDate,
        viewLocalizedTime: viewLocalizedTime || false,
        view24HrTime: view24HrTime || false,
        isGameEvent: true,
      })
    )
    setCurrentEventsTable(currentEventsTableData)
  }

  // return react text node for game type buttons [disabled / all events]
  const eventsInSection = (eventId: number) => {
    let allEvents =
      todayEvents?.filter((te) =>
        eventId === -1 ? te.eventType.id >= 0 : te.eventType.id === eventId
      ) || []

    let remaining = allEvents?.filter((e) => !e.disabled) || []

    if (remaining.length != allEvents.length)
      return (
        <>
          {`${remaining.length}`} / {`${allEvents.length}`}
        </>
      )
    return <>{allEvents.length}</>
  }

  return (
    <>
      <Head>
        <title>Alarms - Lost Ark Timer</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        ></meta>
      </Head>
      <AlarmConfigModal open={configOpen} onOpenChange={setConfigOpen} />

      <div className="bg-background min-h-screen pb-16">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 lg:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous day"
                className="size-11"
                onClick={() => setSelectedDate(selectedDate.minus({ days: 1 }))}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <button
                type="button"
                aria-label="Selected date"
                onClick={() => setSelectedDate(serverTime)}
                className="bg-card hover:bg-accent flex h-11 min-w-[170px] flex-col items-center justify-center rounded-md border px-4 transition-colors"
              >
                <span className="text-xl leading-tight font-semibold">
                  {selectedDate.monthLong} {selectedDate.day}
                </span>
                {!serverTime.hasSame(selectedDate, 'day') && (
                  <span className="text-muted-foreground -mb-1 mt-0.5 text-[0.65rem] leading-tight">
                    {selectedDate.toRelative()}
                  </span>
                )}
              </button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next day"
                className="size-11"
                onClick={() => setSelectedDate(selectedDate.plus({ days: 1 }))}
              >
                <ChevronRight className="size-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Open alarm settings"
                className="size-11"
                onClick={() => setConfigOpen(true)}
              >
                <IconSettings className="size-5 transition hover:rotate-45" />
              </Button>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <Select
                value={resolveRegion(regionTZName)}
                onValueChange={(v) => {
                  const region = v as RegionKey
                  setRegionTZ(RegionTimeZoneMapping[region])
                  setRegionTZName(region)
                }}
              >
                <SelectTrigger size="sm" className="min-w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RegionTimeZoneMapping).map(([name, tz]) => (
                    <SelectItem key={name} value={name}>
                      {`${name} (${tz})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-muted-foreground flex flex-col gap-0.5 text-sm tabular-nums lg:items-end">
                <div
                  className={cn(
                    'flex gap-2',
                    viewLocalizedTime && 'text-foreground font-medium'
                  )}
                >
                  <span>{t('common:current-time')}:</span>
                  <span suppressHydrationWarning>
                    {mounted
                      ? currDate.toLocaleString(
                          view24HrTime
                            ? DateTime.TIME_24_WITH_SHORT_OFFSET
                            : DateTime.TIME_WITH_SHORT_OFFSET
                        )
                      : ''}
                  </span>
                </div>
                <div
                  className={cn(
                    'flex gap-2',
                    !viewLocalizedTime && 'text-foreground font-medium'
                  )}
                >
                  <span>{t('common:server-time')}:</span>
                  <span suppressHydrationWarning>
                    {mounted
                      ? serverTime.toLocaleString(
                          view24HrTime
                            ? DateTime.TIME_24_WITH_SHORT_OFFSET
                            : DateTime.TIME_WITH_SHORT_OFFSET
                        )
                      : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {alertSound !== 'muted' && !unlockedAudio && (
            <button
              type="button"
              onClick={() => {
                setUnlockedAudio(true)
                new Howl({
                  src: sounds[
                    alertSound as AlertSoundKeys
                  ] as unknown as string,
                }).play()
              }}
              className="mt-6 w-full rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-700 transition hover:bg-amber-500/15 dark:text-amber-300"
            >
              Click here to start receiving alert sounds.
            </button>
          )}

          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-base font-medium">
              {selectedDate.hasSame(serverTime, 'day')
                ? 'Alarms'
                : `Viewing events ${selectedDate.toRelative()}`}
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                (Alerts {alertSound === 'muted' ? 'muted' : 'on'})
              </span>
            </h2>
            <Select
              value={String(notifyInMins ?? 15)}
              onValueChange={(v) => setNotifyInMins(Number(v))}
            >
              <SelectTrigger size="sm" className="min-w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20, 30].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {t('common:option-minute-before', { minutes: m })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
            <aside className="flex flex-row flex-wrap gap-1 lg:flex-col lg:pt-2">
              {(() => {
                const filterClass = (active: boolean) =>
                  cn(
                    'group flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-sm font-medium shadow-sm transition active:scale-[0.99]',
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card hover:bg-accent hover:-translate-y-px hover:shadow'
                  )
                const countClass = (active: boolean) =>
                  cn(
                    'text-xs tabular-nums',
                    active
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )
                return (
                  <>
                    <button
                      ref={buttons[0]}
                      onClick={(event) => buttonClick(event, -1)}
                      className={filterClass(selectedEventType === -1)}
                    >
                      <span>All</span>
                      <span className={countClass(selectedEventType === -1)}>
                        {eventsInSection(-1)}
                      </span>
                    </button>
                    {eventTypeIconMapping.map((e: APIEventType) => {
                      const active = selectedEventType === e.id
                      return (
                        <button
                          key={e.id}
                          ref={buttons[e.id + 1]}
                          onClick={(event) => buttonClick(event, e.id)}
                          className={filterClass(active)}
                        >
                          <span className="flex items-center gap-2">
                            <img
                              src={`https://lostarkcodex.com/images/${e.iconUrl}`}
                              alt=""
                              className="size-5 shrink-0"
                              loading="lazy"
                            />
                            {t(`categories.${e.name}`)}
                          </span>
                          <span className={countClass(active)}>
                            {eventsInSection(e.id)}
                          </span>
                        </button>
                      )
                    })}
                  </>
                )
              })()}
            </aside>

            <main className="space-y-4">
              {currentEventsTable.length > 0 ? (
                <div className="rounded-md ring-2 ring-amber-500/40">
                  <table className="w-full">
                    <tbody>{currentEventsTable}</tbody>
                  </table>
                </div>
              ) : null}
              {allEventData === null ? (
                <div className="bg-card text-muted-foreground rounded-lg border p-8 text-center text-sm shadow-sm">
                  Loading events…
                </div>
              ) : fullEventsTable.length === 0 ? (
                <div className="bg-card flex flex-col items-center gap-2 rounded-lg border p-10 text-center shadow-sm">
                  <p className="text-sm font-semibold">
                    No events for{' '}
                    {selectedDate.toLocaleString({
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {selectedEventType === -1
                      ? 'The schedule is empty for this day. Try a nearby date — or this category might not have rotations on this date.'
                      : 'Nothing in this category for this day. Try the All filter or a nearby date.'}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <tbody>{fullEventsTable}</tbody>
                </table>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}

export default Alarms
