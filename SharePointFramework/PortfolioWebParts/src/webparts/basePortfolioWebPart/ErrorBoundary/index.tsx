/* eslint-disable no-console */
import strings from 'PortfolioWebPartsStrings'
import styles from './ErrorBoundaryFallback.module.scss'
import React, { FC } from 'react'
import { format } from '@fluentui/react'
import { IErrorBoundaryFallbackProps } from './types'

export const ErrorBoundaryFallback: FC<IErrorBoundaryFallbackProps> = (props) => {
  console.log(props.error)
  return (
    <div role='alert' className={styles.root}>
      <h3>{format(strings.ErrorBoundaryFallbackText, props.title)}</h3>
      <p>{strings.ErrorBoundaryFallbackDescription}</p>
      <pre className={styles.error}>{props.error.message}</pre>
    </div>
  )
}
