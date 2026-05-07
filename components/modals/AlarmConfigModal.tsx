import React from 'react'
import { Howl, Howler } from 'howler'
import { alert1, alert2, alert3, alert4, alert5, alert6 } from '../../sounds'
import useLocalStorage from '../../util/useLocalStorage'
import { Volume1, Volume2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const sounds = {
  'Alert 1': alert1,
  'Alert 2': alert2,
  'Alert 3': alert3,
  'Alert 4': alert4,
  'Alert 5': alert5,
  'Alert 6': alert6,
}
type AlertSoundKeys =
  | 'Alert 1'
  | 'Alert 2'
  | 'Alert 3'
  | 'Alert 4'
  | 'Alert 5'
  | 'Alert 6'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const Row = ({
  htmlFor,
  label,
  hint,
  control,
}: {
  htmlFor: string
  label: React.ReactNode
  hint?: React.ReactNode
  control: React.ReactNode
}) => (
  <Label
    htmlFor={htmlFor}
    className="hover:bg-accent/50 -mx-2 flex cursor-pointer items-center justify-between gap-4 rounded-md px-2 py-2 text-sm font-normal transition-colors"
  >
    <span className="flex items-center gap-1">
      {label}
      {hint ? (
        <span className="text-muted-foreground text-xs">{hint}</span>
      ) : null}
    </span>
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

const AlarmConfigModal = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation('alarmConfig')

  const [viewLocalizedTime, setViewLocalizedTime] = useLocalStorage<boolean>(
    'viewLocalizedTime',
    true
  )
  const [desktopNotifications, setDesktopNotifications] =
    useLocalStorage<boolean>('desktopNotifications', false)
  const [view24HrTime, setView24HrTime] = useLocalStorage<boolean>(
    'view24HrTime',
    false
  )
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(
    'darkMode',
    defaultTheme
  )
  const [alertSound, setAlertSound] = useLocalStorage<string>(
    'alertSound',
    'muted'
  )
  const [hideGrandPrix, setHideGrandPrix] = useLocalStorage<boolean>(
    'hideGrandPrix',
    false
  )
  const [moveDisabledEventsBottom, setMoveDisabledEventsBottom] =
    useLocalStorage<boolean>('moveDisabledEventsBottom', false)
  const [hideDisabledEvents, setHideDisableEvents] = useLocalStorage<boolean>(
    'hideDisabledEvents',
    false
  )
  const [, setDisabledAlarms] = useLocalStorage<{ [key: string]: number }>(
    'disabledAlarms',
    {}
  )
  const [volume, setVolume] = useLocalStorage('volume', 0.4)

  const requestNotificationPermission = (checked: boolean) => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification')
      return
    }
    if (Notification.permission === 'granted') {
      setDesktopNotifications(checked)
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission((permission) => {
        if (permission === 'granted') setDesktopNotifications(checked)
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('alarm-settings')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
          <div className="flex flex-col">
            <Row
              htmlFor="moveDisabled"
              label={t('move-disabled-events-to-bottom')}
              control={
                <Checkbox
                  id="moveDisabled"
                  checked={!!moveDisabledEventsBottom}
                  onCheckedChange={(c) =>
                    setMoveDisabledEventsBottom(c === true)
                  }
                />
              }
            />
            <Row
              htmlFor="hideDisabled"
              label={t('hide-disabled-events')}
              control={
                <Checkbox
                  id="hideDisabled"
                  checked={!!hideDisabledEvents}
                  onCheckedChange={(c) => setHideDisableEvents(c === true)}
                />
              }
            />
            <Row
              htmlFor="groupRepeats"
              label={t('group-repeat-events')}
              hint={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="text-muted-foreground hover:text-foreground cursor-help text-xs"
                      aria-label="What this does"
                    >
                      [?]
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    Combine all instances of Grand Prix, Field Bosses, Chaos
                    Gates, and Ghost Ships into single events.
                  </TooltipContent>
                </Tooltip>
              }
              control={
                <Checkbox
                  id="groupRepeats"
                  checked={!!hideGrandPrix}
                  onCheckedChange={(c) => setHideGrandPrix(c === true)}
                />
              }
            />

            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisabledAlarms({})}
              >
                {t('reset-disabled-events')}
              </Button>
            </div>
          </div>

          <div className="flex flex-col">
            <Row
              htmlFor="desktopNotif"
              label={t('enable-desktop-notifications')}
              control={
                <Checkbox
                  id="desktopNotif"
                  checked={!!desktopNotifications}
                  onCheckedChange={(c) =>
                    requestNotificationPermission(c === true)
                  }
                />
              }
            />
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

            <Separator className="my-3" />

            <div className="flex items-center justify-between gap-4 py-1">
              <Label className="text-sm">{t('alert-sound')}</Label>
              <Select
                value={alertSound}
                onValueChange={(v) => {
                  setAlertSound(v)
                  if (v === 'muted') return
                  new Howl({
                    src: sounds[v as AlertSoundKeys] as unknown as string,
                  }).play()
                }}
              >
                <SelectTrigger size="sm" className="min-w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="muted">{t('muted')} 🔇</SelectItem>
                  {Object.keys(sounds).map((soundName) => (
                    <SelectItem key={soundName} value={soundName}>
                      {soundName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Volume1 className="text-muted-foreground size-4" />
              <Slider
                disabled={alertSound === 'muted'}
                min={0}
                max={1}
                step={0.02}
                value={[volume ?? 0.4]}
                onValueChange={([v]) => {
                  setVolume(v)
                  Howler.volume(v)
                }}
                onValueCommit={() => {
                  if (alertSound === 'muted') return
                  Howler.stop()
                  new Howl({
                    src: sounds[
                      alertSound as AlertSoundKeys
                    ] as unknown as string,
                  }).play()
                }}
                className="flex-1"
              />
              <Volume2 className="text-muted-foreground size-4" />
            </div>
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

export default AlarmConfigModal
