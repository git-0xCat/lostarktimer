import React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const Entry = ({
  date,
  items,
  ordered = true,
}: {
  date: string
  items: string[]
  ordered?: boolean
}) => {
  const List = ordered ? 'ol' : 'ul'
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{date}</p>
      <List className="text-muted-foreground list-disc space-y-1 pl-6 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
    </div>
  )
}

const ChangeLogModal = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Changelog</DialogTitle>
          <DialogDescription className="sr-only">
            Recent updates and planned features.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-violet-500">Planned</p>
              <ul className="text-muted-foreground list-disc space-y-1 pl-6 text-sm">
                <li>Wandering Merchant Ships</li>
                <li>Daily Reset Timer</li>
                <li>Procyon Compass Checkboxes</li>
                <li>Discord Bot</li>
              </ul>
            </div>

            <Entry
              date="4/7/2022"
              items={[
                'Added new merchant location images (thanks Gutterstyle)!',
                'Added ZH localization (thanks wuge). More translations welcome (:',
                'Added hide by group (thanks Dom).',
                'Added back events that were finished (thanks Roland).',
              ]}
            />
            <Entry
              date="3/24/2022"
              items={[
                'Feature Release: Wandering Merchants!',
                'Added actual alarm reminders, alerts and sounds.',
                'Added hiding of events and customization of hidden events.',
                'Moved settings into config modal.',
              ]}
            />
            <Entry
              date="3/19/2022"
              items={[
                'Fix: alarms should now work after correct user interaction.',
                'Added actual alarm reminders, alerts and sounds.',
                'Added hiding of events and customization of hidden events.',
                'Moved settings into config modal.',
              ]}
            />
            <Entry
              date="3/18/2022"
              items={["Fixed timers from morning's patch."]}
            />
            <Entry
              date="3/17/2022"
              items={[
                "Fixed somewhat borked timers from last night's patch.",
                'Gesbroy and Chaos Gates now displays accurate times.',
                'Events should now automatically update when day passes 12AM.',
                'Added text to show when selected day was not same as current day.',
              ]}
            />
            <Entry
              date="3/16/2022"
              items={[
                'Added light mode colors.',
                'Site is now more mobile friendly!',
                'Added server timezone persistence.',
              ]}
            />
            <p className="text-sm font-medium">3/15/2022: Release v1.0!</p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default ChangeLogModal
