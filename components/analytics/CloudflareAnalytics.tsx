import Script from 'next/script'

export function CloudflareAnalytics() {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') return null

  return (
    <Script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon='{"token": "a4240e015e2044669726099a04d1e7a7"}'
      strategy="afterInteractive"
    />
  )
}
