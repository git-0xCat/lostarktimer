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
    <nav className="invisible fixed bottom-0 left-5 z-40 flex h-2/6 w-10 justify-center lg:visible">
      <div className="flex grow flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="GitHub"
          onClick={onOpenGithub}
          className="hover:text-sky-400"
        >
          <IconBrandGithub />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="PayPal"
          asChild
          className="hover:text-orange-400"
        >
          <a
            href="https://www.paypal.com/paypalme/cwjoshuak"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandPaypal />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Changelog"
          onClick={onOpenChangelog}
          className="hover:text-sky-400"
        >
          <IconFileCode />
        </Button>
        <Separator orientation="vertical" className="mt-3" />
      </div>
    </nav>
  )
}

export default SideBar
