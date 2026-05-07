import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const NavBar = () => {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()

  const isAlarms = router.pathname === '/alarms' || router.pathname === '/'
  const isMerchants = router.pathname === '/merchants'

  return (
    <>
      <div className="bg-sky-700 text-sky-50 py-2 text-center text-sm">
        <a
          href="https://discord.gg/qhnqxtphSg"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline-offset-4 hover:underline"
        >
          Discord Bot now available — click here to join!
        </a>
      </div>

      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/alarms" className="text-lg font-semibold tracking-tight">
              Lost Ark Timer
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/alarms"
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isAlarms
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('alarm-link-text')}
              </Link>
              <Link
                href="/merchants"
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isMerchants
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('merchant-link-text')}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <a
              className="text-muted-foreground hover:text-foreground"
              href="https://discord.gg/beFb23WgNC"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </a>
            <a
              className="text-muted-foreground hover:text-foreground"
              href="https://github.com/cwjoshuak/lostarktimer.app-web"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              className="text-muted-foreground hover:text-foreground"
              href="https://www.buymeacoffee.com/lostarktimer"
              target="_blank"
              rel="noopener noreferrer"
            >
              Support
            </a>
            <div className="flex items-center gap-2">
              <Languages className="text-muted-foreground size-4" />
              <Select
                value={i18n.language || 'en'}
                onValueChange={(v) => i18n.changeLanguage(v)}
              >
                <SelectTrigger size="sm" className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="zh">ZH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default NavBar
