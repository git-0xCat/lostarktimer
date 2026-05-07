import React, { useState, useEffect } from 'react'
import itemMapping from '../data/itemMapping.json'
import itemRarity from '../data/itemRarity.json'
import { DateTime, Zone } from 'luxon'
import WanderingMerchant from '../common/WanderingMerchant'
import useLocalStorage from '../util/useLocalStorage'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

type ItemMappingKey = keyof typeof itemMapping

interface CellProps {
  merchant: WanderingMerchant
  serverTime: DateTime
  localizedTZ: Zone
  view24HrTime: boolean
}

const RARITY_TEXT: Record<0 | 1 | 2 | 3, string> = {
  0: 'text-[#6fc300]',
  1: 'text-[#00b5ff]',
  2: 'text-[#bf00fe]',
  3: 'text-[#f39303]',
}

const rarityFromId = (id: number): 0 | 1 | 2 | 3 => {
  const ir = itemRarity as { [key: string]: 0 | 1 | 2 | 3 }
  return ir[String(id)] ?? 0
}

const goodItemRarityClass = (goodItem: string | null): string => {
  if (!goodItem) return ''
  switch (goodItem.split(' ')[0]) {
    case 'No':
      return RARITY_TEXT[0]
    case 'Seria':
    case 'Sian':
      return RARITY_TEXT[1]
    case 'Madnick':
    case 'Mokamoka':
    case 'Kaysarr':
      return RARITY_TEXT[2]
    case 'Wei':
    case 'Legendary':
      return RARITY_TEXT[3]
    default:
      return ''
  }
}

const iconURL = (item: number) => {
  const mapping = itemMapping[String(item) as ItemMappingKey]
  return mapping
    ? `https://lostarkcodex.com/icons/${mapping.fileName}`
    : ''
}

const openLocationImage = (imageUrl: string, title: string) => {
  if (!imageUrl) return
  window.open(
    `https://i.imgur.com/${imageUrl}`,
    title,
    'left=20,top=20,width=1000,height=600,toolbar=0,resizable=1,noopener=1,noreferrer=1'
  )
}

const MerchantTableCell = (props: CellProps): React.ReactElement => {
  const { t } = useTranslation('merchants')
  const { merchant, serverTime, localizedTZ, view24HrTime } = props

  const [hideMerchantItems] = useLocalStorage<boolean>(
    'hideMerchantItems',
    false
  )
  const [hidePotentialSpawns] = useLocalStorage<boolean>(
    'hidePotentialMerchantLocationSpawns',
    false
  )

  const computeCountdown = () => {
    const next = merchant.nextSpawnTime(serverTime)
    if (!next?.start) return null
    return next.start.setZone(serverTime.zone).diff(DateTime.now())
  }

  const [nextSpawnCountdown, setNextSpawnCountdown] = useState(
    computeCountdown()
  )
  useEffect(() => {
    const timer = setInterval(() => setNextSpawnCountdown(computeCountdown()), 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const inProgress = !!merchant.inProgress(serverTime)
  const localInProgress = !!merchant.inProgress(serverTime.setZone(localizedTZ))

  let imageUrl = ''
  if (merchant.location) {
    imageUrl =
      merchant.locationImages[
        Object.keys(merchant.locationImages).find(
          (k) => k.toLowerCase() === merchant.location?.toLowerCase()
        ) || ''
      ]
  }

  const nextSpawnLabel = merchant
    .nextSpawnTime(serverTime)
    ?.start?.setZone(localizedTZ)
    .toLocaleString(view24HrTime ? DateTime.TIME_24_SIMPLE : DateTime.TIME_SIMPLE)

  return (
    <td className="basis-1/2 p-2 align-top">
      <div
        className={cn(
          'group bg-card flex flex-col gap-3 rounded-lg border p-4 shadow-sm transition',
          merchant.spawned &&
            'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/50',
          !merchant.spawned && !inProgress && 'opacity-70'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'text-base font-semibold uppercase tracking-tight',
                localInProgress && 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {merchant.name}{' '}
              <span className="text-muted-foreground font-normal normal-case">
                ({t(`locations.${merchant.continent}`)})
              </span>
              {inProgress && (
                <span className="ml-2 text-xs font-mono text-amber-600 dark:text-amber-300">
                  {serverTime
                    .set({ minute: 30 })
                    .setZone(localizedTZ)
                    .toLocaleString(
                      view24HrTime
                        ? DateTime.TIME_24_SIMPLE
                        : DateTime.TIME_SIMPLE
                    )}{' '}
                  –{' '}
                  {serverTime
                    .set({ minute: 55 })
                    .setZone(localizedTZ)
                    .toLocaleString(
                      view24HrTime
                        ? DateTime.TIME_24_SIMPLE
                        : DateTime.TIME_SIMPLE
                    )}
                </span>
              )}
            </p>

            {inProgress && (
              <div className="text-muted-foreground mt-1 space-y-0.5 text-sm">
                <div>
                  <span className="uppercase">{t('location')}: </span>
                  {merchant.spawned ? (
                    <button
                      type="button"
                      onClick={() =>
                        openLocationImage(imageUrl, merchant.location || '')
                      }
                      className="text-blue-500 underline-offset-4 hover:underline"
                    >
                      {t(`locations.${merchant.location}`)}
                    </button>
                  ) : (
                    <span>Unknown</span>
                  )}
                </div>
                <div>
                  <span className="uppercase">Item: </span>
                  {merchant.goodItems
                    ? merchant.goodItems.map((goodItem, index) => (
                        <span
                          key={`${merchant.name}-good-${index}`}
                          className={
                            merchant.spawned
                              ? goodItemRarityClass(goodItem)
                              : undefined
                          }
                        >
                          {goodItem}
                          {index === 0 ? ', ' : ''}
                        </span>
                      ))
                    : 'Unknown'}
                </div>
              </div>
            )}

            <div className="text-muted-foreground mt-2 flex items-baseline gap-2 text-sm">
              <span className="uppercase">{t('next-spawn')}:</span>
              <span className="font-mono tabular-nums">{nextSpawnLabel}</span>
              {!inProgress && nextSpawnCountdown && (
                <span className="text-amber-600 dark:text-amber-300 font-mono text-xs">
                  -{nextSpawnCountdown.toFormat('hh:mm:ss')}
                </span>
              )}
            </div>
          </div>

          {!merchant.spawned && !hidePotentialSpawns && (
            <div className="text-muted-foreground w-32 shrink-0 text-right text-xs">
              <div className="mb-1 uppercase">{t('potential-spawns')}</div>
              <div className="space-y-0.5">
                {Object.entries(merchant.locationImages).map(
                  ([locationName, imgUrl]) => (
                    <button
                      key={`${merchant.name}-${locationName}`}
                      type="button"
                      onClick={() => openLocationImage(imgUrl, locationName)}
                      className="block w-full text-right text-blue-500 underline-offset-4 hover:underline"
                    >
                      {t(`locations.${locationName}`)}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {!hideMerchantItems && (
          <div className="grid grid-cols-2 gap-3 border-t pt-3 xl:grid-cols-3">
            {[
              { title: 'Rapport', items: merchant.items.rapport },
              { title: 'Cards', items: merchant.items.cards },
              { title: 'Cooking', items: merchant.items.cooking },
            ]
              .filter(({ items }) => items.length > 0)
              .map(({ title, items }) => (
                <div key={`${merchant.name}-${title}`}>
                  <p className="mb-1 text-xs font-semibold uppercase">
                    {title}
                  </p>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li
                        key={`${merchant.name}-${title}-${item}`}
                        className={cn(
                          'flex items-center gap-2 text-xs',
                          RARITY_TEXT[rarityFromId(item)]
                        )}
                      >
                        <img
                          src={iconURL(item)}
                          alt={
                            itemMapping[String(item) as ItemMappingKey]?.name ??
                            ''
                          }
                          width={20}
                          height={20}
                          loading="lazy"
                          decoding="async"
                          className="size-5 shrink-0 rounded-sm"
                        />
                        <span className="truncate capitalize">
                          {t(`items.${item}.name`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </div>
    </td>
  )
}

export default MerchantTableCell
