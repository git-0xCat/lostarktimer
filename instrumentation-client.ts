import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production',
  tracesSampleRate: 0.1,
  sendDefaultPii: true,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
