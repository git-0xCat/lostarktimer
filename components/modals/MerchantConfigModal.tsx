import React from 'react'
import useLocalStorage from '../../util/useLocalStorage'
import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const Row = ({
  htmlFor,
  label,
  control,
}: {
  htmlFor: string
  label: React.ReactNode
  control: React.ReactNode
}) => (
  <Label
    htmlFor={htmlFor}
    className="hover:bg-accent/50 -mx-2 flex cursor-pointer items-center justify-between gap-4 rounded-md px-2 py-2 text-sm font-normal transition-colors"
  >
    <span>{label}</span>
    {control}
  </Label>
)

const defaultTheme = (): boolean =>
  Boolean(
    typeof window !== 'undefined' &&
      (localStorage.getItem('darkMode') ||
        (window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches))
  )

const MerchantConfigModal = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation('merchantConfig')
  const [viewLocalizedTime, setViewLocalizedTime] = useLocalStorage<boolean>(
    'viewLocalizedTime',
    true
  )
  const [view24HrTime, setView24HrTime] = useLocalStorage<boolean>(
    'view24HrTime',
    false
  )
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(
    'darkMode',
    defaultTheme
  )
  const [hideMerchantItems, setHideMerchantItems] = useLocalStorage<boolean>(
    'hideMerchantItems',
    false
  )
  const [hidePotentialSpawns, sethidePotentialSpawns] = useLocalStorage<boolean>(
    'hidePotentialMerchantLocationSpawns',
    false
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('merchant-settings')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
          <div className="flex flex-col">
            <Row
              htmlFor="hideMerchantItems"
              label={t('hide-merchant-items')}
              control={
                <Checkbox
                  id="hideMerchantItems"
                  checked={!!hideMerchantItems}
                  onCheckedChange={(c) => setHideMerchantItems(c === true)}
                />
              }
            />
            <Row
              htmlFor="hidePotentialSpawns"
              label={t('hide-merchant-potential-spawns')}
              control={
                <Checkbox
                  id="hidePotentialSpawns"
                  checked={!!hidePotentialSpawns}
                  onCheckedChange={(c) => sethidePotentialSpawns(c === true)}
                />
              }
            />
          </div>

          <div className="flex flex-col">
            <Row
              htmlFor="darkMode"
              label={t('common:dark-mode')}
              control={
                <Checkbox
                  id="darkMode"
                  checked={!!darkMode}
                  onCheckedChange={(c) => setDarkMode(c === true)}
                />
              }
            />
            <Row
              htmlFor="view24Hr"
              label={t('common:view-in-24-hr')}
              control={
                <Checkbox
                  id="view24Hr"
                  checked={!!view24HrTime}
                  onCheckedChange={(c) => setView24HrTime(c === true)}
                />
              }
            />
            <Row
              htmlFor="viewLocalized"
              label={t('common:view-in-current-time')}
              control={
                <Checkbox
                  id="viewLocalized"
                  checked={!!viewLocalizedTime}
                  onCheckedChange={(c) => setViewLocalizedTime(c === true)}
                />
              }
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button className="w-full sm:w-auto">{t('common:all-done')}!</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MerchantConfigModal
