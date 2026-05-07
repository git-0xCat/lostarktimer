import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useState, useRef, useEffect } from 'react'
import merchantSchedules from '../data/merchantSchedules.json'
const saintbotImage = '/images/saint-bot.png'
import { DateTime, Interval } from 'luxon'
import useLocalStorage from '../util/useLocalStorage'
import regions from '../data/regions.json'
import merchantsData from '../data/merchants.json'
import { createTableData } from '../util/createTableData'
import WanderingMerchant from '../common/WanderingMerchant'
import io, { Socket } from 'socket.io-client'
import { MerchantAPIData, RegionKey, ServerKey } from '../util/types/types'
import { RegionTimeZoneMapping } from '../util/static'
import { IconSettings } from '@tabler/icons-react'
import MerchantConfigModal from '../components/modals/MerchantConfigModal'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Merchant {
  location: string
  item: string
  name: string
}

const Merchants: NextPage = (props) => {
  const { t } = useTranslation('merchants')
  const [regionTZName, setRegionTZName] = useLocalStorage<RegionKey>(
    'regionTZName',
    'US West'
  )
  const [selectedServer, setSelectedServer] = useLocalStorage<ServerKey>(
    'merchantServer',
    'Shandi'
  )
  const isMounted = useRef(false);
  const defaultTheme = (): boolean => {
    // Defaults to system theme if unconfigured
    return Boolean(localStorage.getItem('darkMode') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches))
  }
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('darkMode', defaultTheme)
  useEffect(()=> {
    //Prevents FoUC (Flash of Unstylized Content) by not refreshing on first mount
    if (!isMounted.current){ isMounted.current = true; return }

    document.documentElement.classList.toggle('dark', !!darkMode)
  }, [darkMode])

  const [currDate, setCurrDate] = useState<DateTime>(DateTime.now())
  const [regionTZ, setRegionTZ] = useLocalStorage<string>('regionTZ', 'UTC-7')

  const [serverTime, setServerTime] = useState<DateTime>(
    currDate.setZone(regionTZ)
  )
  const [viewLocalizedTime, setViewLocalizedTime] = useLocalStorage<boolean>(
    'viewLocalizedTime',
    true
  )
  const [view24HrTime, setView24HrTime] = useLocalStorage<boolean>(
    'view24HrTime',
    false
  )
  const [mSchedules, setMSchedules] = useState<{ [k: string]: Interval[] }>({})

  useEffect(() => {
    const timer = setInterval(() => {
      let now = DateTime.now()
      setCurrDate(now)
      setServerTime(now.setZone(regionTZ))
    }, 1000)
    return () => {
      clearInterval(timer) // Return a funtion to clear the timer so that it will stop being called on unmount
    }
  }, [regionTZName, regionTZ])

  useEffect(() => {
    if (regionTZ) setServerTime(DateTime.now().setZone(regionTZ))
  }, [regionTZName, regionTZ])
  const [merchantAPIData, setMerchantAPIData] = useState<{
    [key: string]: MerchantAPIData
  }>({})
  const [socket, setSocket] = useState<Socket | null>(null)
  const [merchantTableData, setMerchantTableData] = useState<
    Array<React.JSX.Element>
  >([])
  const [configOpen, setConfigOpen] = useState(false)

  const [wanderingMerchants, setWanderingMerchants] = useState<
    WanderingMerchant[]
  >([])
  const [apiData, setAPIData] = useState<{ [key: string]: MerchantAPIData }>({})
  const [dataLastRefreshed, setDataLastRefreshed] = useState(currDate)
  useEffect(() => {
    const newSocket = io(`wss://ws.lostarktimer.app`)

    if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
      newSocket.disconnect()
    }

    newSocket.on('merchants', (data) => {
      setAPIData(data)
    })

    setSocket(newSocket)
    return () => {
      newSocket.close()
    }
  }, [])

  useEffect(() => {
    setMerchantAPIData({ ...merchantAPIData, ...apiData })
    setDataLastRefreshed(DateTime.now())
  }, [apiData])

  useEffect(() => {
    if (regionTZName) {
      let servers = regions[regionTZName]
      if (!servers.includes(selectedServer || ''))
        setSelectedServer(servers[0] as ServerKey)
      let newMSchedules: { [key: string]: Interval[] } = {}
      Object.entries(merchantSchedules).forEach(([key, val]) => {
        newMSchedules[key] = val.map(({ h, m }) => {
          let start = DateTime.fromObject(
            { hour: h, minute: m },
            { zone: regionTZ }
          )
          return Interval.fromDateTimes(start, start.plus({ minutes: 25 }))
        })
        let dayPlusOne = DateTime.fromObject(
          { hour: val[0].h, minute: val[0].m },
          { zone: regionTZ }
        ).plus({ days: 1 })
        newMSchedules[key].push(
          Interval.fromDateTimes(dayPlusOne, dayPlusOne.plus({ minutes: 25 }))
        )
      })
      setMSchedules(newMSchedules)
      setWanderingMerchants(
        Object.values(merchantsData).map(
          (m) =>
            new WanderingMerchant(
              m.name,
              m.items,
              m.continent,
              m.schedule,
              m.locations as {},
              newMSchedules[String(m.schedule)]
            )
        )
      )
    }
  }, [regionTZName])
  useEffect(() => {
    if (socket?.connected && selectedServer) {
      socket.removeAllListeners()
      socket.emit('join', `${selectedServer.toLowerCase()}`)
      socket.on('merchants', (data) => {
        setAPIData(data)
      })
    }
  }, [socket?.connected, selectedServer])
  useEffect(() => {
    let data = Object.values(merchantAPIData).filter(
      (m) => m.server === selectedServer?.toLowerCase()
    )
    wanderingMerchants.forEach((wm) => {
      let fm = data.find((m) => wm.name === m.name)
      if (fm) wm.setSpawn(fm.location, fm.item, Number(fm._id))
      else wm.unsetSpawn()
    })

    wanderingMerchants.sort((a, b) => {
      let inProgA = a.inProgress(serverTime)
      let inProgB = b.inProgress(serverTime)

      if (inProgA && inProgB) return a.name.localeCompare(b.name)
      else if (inProgA) return -1
      else if (inProgB) return 1
      // return a.name.localeCompare(b.name)
      let aSpawn = a.nextSpawnTime(serverTime)?.start
      let bSpawn = b.nextSpawnTime(serverTime)?.start
      if (aSpawn && bSpawn) {
        if (aSpawn.hour == bSpawn.hour) return a.name.localeCompare(b.name)
        else return aSpawn.diff(bSpawn).toMillis()
      }
      return a.name.localeCompare(b.name)
    })

    setMerchantTableData(
      createTableData({
        events: wanderingMerchants,
        serverTime: serverTime,
        currDate: currDate,
        viewLocalizedTime: viewLocalizedTime || false,
        view24HrTime: view24HrTime || false,
        isGameEvent: false,
      })
    )
  }, [
    regionTZName,
    view24HrTime,
    viewLocalizedTime,
    selectedServer,
    wanderingMerchants,
    merchantAPIData,
    mSchedules,
  ])
  useEffect(() => {
    if (currDate.minute < 30 || currDate.minute >= 55) setMerchantAPIData({})
  }, [currDate.minute])
  return (
    <>
      <Head>
        <title>Merchants - Lost Ark Timer</title>
      </Head>
      <MerchantConfigModal open={configOpen} onOpenChange={setConfigOpen} />

      <div className="bg-background min-h-screen pb-16">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 lg:px-6">
          <div className="bg-card mb-6 flex flex-col gap-2 rounded-lg border border-amber-500/40 p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center self-start rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Work in Progress
            </span>
            <p className="text-muted-foreground text-sm">
              Wandering merchant tracking is being rebuilt around community
              submissions. Soon you&apos;ll be able to vote a sighting up or
              down to crowdsource accurate spawn data instead of relying on
              the stale broadcast feed.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Wandering Merchants
              </h1>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Open merchant settings"
                className="size-11"
                onClick={() => setConfigOpen(true)}
              >
                <IconSettings className="size-5 transition hover:rotate-45" />
              </Button>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={regionTZName ?? 'US West'}
                  onValueChange={(v) => {
                    const region = v as RegionKey
                    setRegionTZName(region)
                    setRegionTZ(RegionTimeZoneMapping[region])
                  }}
                >
                  <SelectTrigger size="sm" className="min-w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(regions).map((reg) => (
                      <SelectItem key={reg} value={reg.replace('-', ' ')}>
                        {reg.replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {regionTZName && (
                  <Select
                    value={selectedServer ?? ''}
                    onValueChange={(v) => setSelectedServer(v as ServerKey)}
                  >
                    <SelectTrigger size="sm" className="min-w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {regions[regionTZName as RegionKey].map((server) => (
                        <SelectItem key={server} value={server}>
                          {server}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="text-muted-foreground flex flex-col gap-0.5 text-sm tabular-nums lg:items-end">
                <div
                  className={cn(
                    'flex gap-2',
                    viewLocalizedTime && 'text-foreground font-medium'
                  )}
                >
                  <span>{t('common:current-time')}:</span>
                  <span suppressHydrationWarning>
                    {isMounted.current
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
                    {isMounted.current
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

          <p
            className="text-muted-foreground mt-4 hidden text-sm sm:block"
            dangerouslySetInnerHTML={{
              __html: t('server-note-text', {
                timeType: viewLocalizedTime ? 'CURRENT TIME' : 'SERVER TIME',
              }),
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-[1800px] px-4 lg:px-6">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
            <a
              href="https://saint-bot.webflow.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground inline-flex items-center gap-2 hover:underline"
            >
              {t('data-by')} SaintBot
              <img
                src={saintbotImage}
                alt=""
                width={16}
                height={16}
                loading="lazy"
                decoding="async"
              />
            </a>
            <span className="text-muted-foreground">·</span>
            <span
              className="text-muted-foreground tabular-nums"
              suppressHydrationWarning
            >
              {t('last-updated')}:{' '}
              {isMounted.current
                ? dataLastRefreshed.toLocaleString(
                    view24HrTime
                      ? DateTime.TIME_24_WITH_SECONDS
                      : DateTime.TIME_WITH_SECONDS
                  )
                : ''}
            </span>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[1, 2, 3].map((sched) => (
              <div
                key={`schedule-${sched}`}
                className="bg-card rounded-lg border p-4 shadow-sm"
              >
                <p className="mb-2 text-sm font-semibold uppercase tracking-tight">
                  Schedule {sched}
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <ul className="text-muted-foreground space-y-0.5 font-mono tabular-nums">
                    {mSchedules[sched] !== undefined &&
                      mSchedules[sched]
                        .slice(0, (mSchedules[sched].length - 1) / 2)
                        .map((s) =>
                          s.start!.setZone(
                            viewLocalizedTime ? currDate.zone : serverTime.zone
                          )
                        )
                        .sort((a, b) => a.hour - b.hour)
                        .map((schedule) => (
                          <li
                            key={`merchant-schedule-${sched}-${schedule.toISO()}`}
                          >
                            {schedule
                              .toLocaleString(DateTime.TIME_SIMPLE)
                              .slice(0, -2)}
                          </li>
                        ))}
                  </ul>
                  <ul className="space-y-0.5">
                    {sched === 1 && (
                      <>
                        <li>Lucas — {t('locations.Yudia')}</li>
                        <li>Morris — {t('locations.East Luterra')}</li>
                        <li>Mac — {t('locations.Anikka')}</li>
                        <li>Jeffrey — {t('locations.Shushire')}</li>
                        <li>Dorella — {t('locations.Feiton')}</li>
                      </>
                    )}
                    {sched === 2 && (
                      <>
                        <li>Malone — {t('locations.West Luterra')}</li>
                        <li>Burt — {t('locations.East Luterra')}</li>
                        <li>Oliver — {t('locations.Tortoyk')}</li>
                        <li>Nox — {t('locations.Arthetine')}</li>
                        <li>Aricer — {t('locations.Rohendel')}</li>
                        <li>Rayni — {t('locations.Punika')}</li>
                      </>
                    )}
                    {sched === 3 && (
                      <>
                        <li>Ben — {t('locations.Rethramis')}</li>
                        <li>Evan — {t('locations.South Vern')}</li>
                        <li>Peter — {t('locations.North Vern')}</li>
                        <li>Laitir — {t('locations.Yorn')}</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <table className="w-full">
            <tbody>{merchantTableData}</tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default Merchants
