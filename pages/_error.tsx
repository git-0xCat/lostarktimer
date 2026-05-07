import * as Sentry from '@sentry/nextjs'
import Error, { ErrorProps } from 'next/error'
import type { NextPageContext } from 'next'

const CustomErrorComponent = (props: ErrorProps) => {
  return <Error statusCode={props.statusCode} />
}

CustomErrorComponent.getInitialProps = async (contextData: NextPageContext) => {
  await Sentry.captureUnderscoreErrorException(contextData)
  return Error.getInitialProps(contextData)
}

export default CustomErrorComponent
