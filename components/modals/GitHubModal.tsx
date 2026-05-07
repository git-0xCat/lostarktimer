import React from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GitHubModal = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>GitHub</DialogTitle>
        </DialogHeader>
        <p className="text-center">
          <a
            className="text-blue-500 underline-offset-4 hover:underline"
            href="https://github.com/cwjoshuak/lostarktimer.app-web"
            target="_blank"
            rel="noopener noreferrer"
          >
            Looking to contribute?
          </a>
        </p>
        <p className="text-muted-foreground text-sm">
          Feel free to send me a{' '}
          <a
            href="https://discord.com/users/120909965547405312"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline-offset-4 hover:underline"
          >
            DM here
          </a>{' '}
          (@josh.8746) if you want to report a bug or suggest something new!
        </p>
      </DialogContent>
    </Dialog>
  )
}

export default GitHubModal
