import '../styles/globals.css'
import { useState } from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Script from 'next/script'
import ChangeLogModal from '../components/modals/ChangeLogModal'
import GitHubModal from '../components/modals/GitHubModal'
import SideBar from '../components/SideBar'
import '../util/i18n'
import { IconBrandTwitch } from '@tabler/icons-react'
import { SWRConfig } from 'swr'
import NavBar from '../components/NavBar'

function MyApp({ Component, pageProps }: AppProps) {
  const [ghOpen, setGhOpen] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)

  return (
    <>
      <Head>
        <title>Lost Ark Timer</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=0.35"
        />
        <meta property="og:title" content="Lost Ark Timer" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.lostarktimer.app/" />
        <meta
          property="og:image"
          content="https://www.lostarktimer.app/images/LA_Mokko_seed.png"
        />
        <meta
          name="og:description"
          content="Lost Ark Timer - Alarms for Lost Ark bosses, islands, events and more."
        />
        <meta
          name="description"
          content="Lost Ark Timer - Alarms for Lost Ark bosses, islands, events and more."
        />
      </Head>

      <NavBar />
      <ChangeLogModal open={changelogOpen} onOpenChange={setChangelogOpen} />
      <GitHubModal open={ghOpen} onOpenChange={setGhOpen} />
      <SideBar
        onOpenGithub={() => setGhOpen(true)}
        onOpenChangelog={() => setChangelogOpen(true)}
      />

      <SWRConfig
        value={{
          refreshInterval: 30000,
          dedupingInterval: 20000,
          focusThrottleInterval: 20000,
          fetcher: (resource, init) =>
            fetch(resource, init).then((res) => res.json()),
        }}
      >
        <Component className="z-0" {...pageProps} />
      </SWRConfig>

      <footer className="bg-background text-muted-foreground relative bottom-0 z-50 flex h-12 w-full items-center justify-center border-t text-sm">
        I might start streaming myself coding the website, just for fun.
        Starting Monday. Follow ={'>'}
        <a
          className="ml-1 inline-flex items-center"
          href="https://www.twitch.tv/delay3d"
          rel="noopener noreferrer"
          style={{ color: '#6441a5' }}
        >
          <IconBrandTwitch className="mr-1 inline" />{' '}
          https://www.twitch.tv/delay3d
        </a>
      </footer>

      {process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? (
        <>
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon='{"token": "a4240e015e2044669726099a04d1e7a7"}'
            strategy="afterInteractive"
            onError={(e) => {
              console.error('Script failed to load', e)
            }}
          />
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-Z2D1S06JHH"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Z2D1S06JHH');`}
          </Script>
        </>
      ) : null}
    </>
  )
}
export default MyApp
