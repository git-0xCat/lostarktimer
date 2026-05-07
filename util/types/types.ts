import { Interval } from 'luxon'
import regions from '../../data/regions.json'

export interface MerchantData {
  name: string
  continent: string
  schedule: number
  items: { rapport: number[]; cards: number[]; cooking: number[] }
  uuid: string
  times: Interval[]
}

export interface MerchantAPIData {
  _id: string
  region: string
  server: string
  location: string
  item: string
  name: string
}

export type RegionKey = keyof typeof regions

export type ServerKey = (typeof regions)[RegionKey][number]
