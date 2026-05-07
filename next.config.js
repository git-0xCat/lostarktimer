/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/alarms',
        permanent: true,
      },
    ]
  },
}

const { withSentryConfig } = require('@sentry/nextjs')

// Sentry org + project come from SENTRY_ORG / SENTRY_PROJECT env vars,
// which the build plugin reads by default — keeps the workspace slugs
// out of public source.
module.exports = withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  widenClientFileUpload: true,

  // Route browser-side Sentry traffic through this Next path so ad-blockers
  // (uBlock, Brave Shields) don't drop error reports.
  tunnelRoute: '/monitoring',

  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
