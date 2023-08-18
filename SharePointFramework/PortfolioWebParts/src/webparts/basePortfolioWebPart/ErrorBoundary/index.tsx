/* eslint-disable no-console */
import strings from 'PortfolioWebPartsStrings'
import styles from './ErrorBoundaryFallback.module.scss'
import React, { FC } from 'react'
import { format } from '@fluentui/react'
import { IErrorBoundaryFallbackProps } from './types'

export const ErrorBoundaryFallback: FC<IErrorBoundaryFallbackProps> = ({ title, error }) => {
  console.error(error)
  return (
    <div role='alert' className={styles.root}>
      <h3>{format(strings.ErrorBoundaryFallbackText, title)}</h3>
      <p>{strings.ErrorBoundaryFallbackDescription}</p>
      <pre className={styles.error}>{error.message}</pre>
    </div>
  )
}
