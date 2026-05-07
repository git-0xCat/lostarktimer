import React, { useEffect, useState } from 'react'
import { GameEvent } from '../common'
import { DateTime, Duration, Zone } from 'luxon'
import { MoreVertical } from 'lucide-react'
import useLocalStorage from '../util/useLocalStorage'
import { generateTimestampStrings } from '../util/createTableData'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type CellProps = {
  gameEvent: GameEvent
  serverTime: DateTime
  localizedTZ: Zone
  view24HrTime: boolean | undefined
}

// Event IDs that the legacy code treated as "repeated grand-prix-style"
// events; toggling 'group repeated events' shows/hides duplicates.
const REPEATED_EVENT_IDS = new Set([945, 946, 947, 948, 949, 950, 951])

const GameEventTableCell = (props: CellProps): React.ReactElement => {
  const { t, i18n } = useTranslation('events')
  const { gameEvent, serverTime, localizedTZ, view24HrTime } = props
  const [disabledAlarms, setDisabledAlarms] = useLocalStorage<{
    [key: string]: number
  }>('disabledAlarms', {})
  const [hideGrandPrix, setHideGrandPrix] = useLocalStorage<boolean>(
    'hideGrandPrix',
    false
  )

  const millisUntilLatest = (against: DateTime): number | null => {
    const next = gameEvent.latest(serverTime)
    if (!next || !next.start) return null
    return next.start.diff(against).toMillis()
  }
  const initialMs = millisUntilLatest(serverTime)
  const [timeUntil, setTimeUntil] = useState<Duration | null>(
    initialMs === null ? null : Duration.fromMillis(initialMs)
  )
  useEffect(() => {
    if (gameEvent.disabled) return
    const timer = setInterval(() => {
      const ms = millisUntilLatest(DateTime.now().setZone(serverTime.zone))
      setTimeUntil(ms === null ? null : Duration.fromMillis(ms))
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyDisable = (until: DateTime | null | undefined) => {
    if (!until) return
    setDisabledAlarms({
      ...(disabledAlarms ?? {}),
      [gameEvent.gameEvent.id]: until.toMillis(),
    })
    gameEvent.disabled = until
  }

  const enable = () => {
    if (!disabledAlarms) return
    const next = { ...disabledAlarms }
    delete next[gameEvent.gameEvent.id]
    gameEvent.disabled = null
    setDisabledAlarms(next)
  }

  const latestEnd = (): DateTime | null => {
    const next = gameEvent.latest(serverTime)
    return next?.end ?? null
  }

  const disableOnce = () => applyDisable(latestEnd())
  const disable12Hours = () => applyDisable(latestEnd()?.plus({ hours: 12 }))
  const disableThreeWeeks = () =>
    applyDisable(latestEnd()?.plus({ hours: 336 }))

  const disableDailyReset = () => {
    let until = DateTime.now().set({
      hour: 5,
      minute: 0,
      second: 0,
      millisecond: 0,
    })
    if (until <= DateTime.now()) until = until.plus({ days: 1 })
    applyDisable(until)
  }

  const disableWeeklyReset = () => {
    let until = DateTime.now().set({
      weekday: 4,
      hour: 5,
      minute: 0,
      second: 0,
      millisecond: 0,
    })
    if (until <= DateTime.now()) until = until.plus({ days: 7 })
    applyDisable(until)
  }

  const isRepeatedEvent = REPEATED_EVENT_IDS.has(Number(gameEvent.gameEvent.id))
  const isGrouped = isRepeatedEvent && hideGrandPrix
  const isDisabled = !!gameEvent.disabled

  // Prefer the metadata name from data/events.json — it's freshly
  // scraped and accurate. Fall back to i18n only when the metadata is
  // empty, or when a non-English locale provides a real translation
  // (the en/events.json file is stale; zh/events.json has actual
  // translations worth keeping).
  const metadataName = gameEvent.gameEvent.name
  const translated = t(`${gameEvent.gameEvent.id}`)
  const hasTranslation = translated !== gameEvent.gameEvent.id
  const eventLabel = isGrouped
    ? gameEvent.groupName
    : metadataName
      ? i18n.language !== 'en' && hasTranslation
        ? translated
        : metadataName
      : hasTranslation
        ? translated
        : gameEvent.gameEvent.id

  return (
    <td className="basis-full p-2 align-top md:basis-1/2">
      <div
        className={cn(
          'bg-card group relative flex items-start gap-3 rounded-lg border p-3 shadow-sm transition',
          isDisabled && 'opacity-50'
        )}
      >
        <img
          src={`https://lostarkcodex.com/icons/${gameEvent.gameEvent.iconUrl}`}
          alt={gameEvent.gameEvent.name}
          width={36}
          height={36}
          loading="lazy"
          decoding="async"
          className="size-9 shrink-0 rounded-md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold uppercase">
              {!isGrouped && (
                <span className="text-muted-foreground mr-1 font-normal">
                  [{gameEvent.gameEvent.minItemLevel}]
                </span>
              )}
              {eventLabel}
            </p>
            {!isDisabled && timeUntil && (
              <span className="text-amber-500 dark:text-amber-300 shrink-0 font-mono text-xs tabular-nums">
                {timeUntil.toFormat('hh:mm:ss')}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 flex flex-wrap gap-x-1 text-xs">
            {gameEvent.times.map((interval, idx) =>
              generateTimestampStrings(
                gameEvent,
                interval,
                serverTime,
                localizedTZ,
                view24HrTime || false,
                idx
              )
            )}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Event actions"
              className="size-7 shrink-0 opacity-60 transition group-hover:opacity-100"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {isRepeatedEvent && (
              <>
                <DropdownMenuItem
                  onClick={() => setHideGrandPrix(!hideGrandPrix)}
                >
                  {hideGrandPrix
                    ? t('alarms:repeated-events.show')
                    : t('alarms:repeated-events.hide')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {isDisabled ? (
              <DropdownMenuItem onClick={enable}>
                {t('alarms:enable')}
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuLabel>{t('alarms:disable.until')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={disableOnce}>
                  {t('alarms:disable.once')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={disable12Hours}>
                  {t('alarms:disable.12hrs')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={disableDailyReset}>
                  {t('alarms:disable.daily-reset')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={disableWeeklyReset}>
                  {t('alarms:disable.weekly-reset')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={disableThreeWeeks}
                >
                  {t('alarms:disable.all')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </td>
  )
}

export default GameEventTableCell
