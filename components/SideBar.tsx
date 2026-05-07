import React from 'react'
import {
  IconBrandGithub,
  IconBrandPaypal,
  IconFileCode,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface Props {
  onOpenGithub: () => void
  onOpenChangelog: () => void
}

const SideBar = ({ onOpenGithub, onOpenChangelog }: Props) => {
  return (
    <nav className="invisible fixed bottom-0 left-5 z-40 flex h-2/6 w-12 justify-center lg:visible">
      <div className="flex grow flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="GitHub"
          onClick={onOpenGithub}
          className="size-12 hover:text-sky-400"
        >
          <IconBrandGithub className="size-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="PayPal"
          asChild
          className="size-12 hover:text-orange-400"
        >
          <a
            href="https://www.paypal.com/paypalme/cwjoshuak"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandPaypal className="size-6" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Changelog"
          onClick={onOpenChangelog}
          className="size-12 hover:text-sky-400"
        >
          <IconFileCode className="size-6" />
        </Button>
        <Separator orientation="vertical" className="mt-3" />
      </div>
    </nav>
  )
}

export default SideBar
