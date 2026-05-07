import Script from 'next/script'

export function UmamiScript() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  if (!src || !websiteId) return null

  return (
    <Script
      defer
      src={src}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  )
}
