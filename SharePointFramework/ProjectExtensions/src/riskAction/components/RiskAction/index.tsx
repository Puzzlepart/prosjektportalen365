import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import React, { FC } from 'react'
import styles from './RiskAction.module.scss'
import { RiskActionFieldValue } from './RiskActionFieldValue'
import { IRiskActionProps } from './types'
import { NewRiskActionDialog } from './NewRiskActionDialog'

export const RiskAction: FC<IRiskActionProps> = (props) => {
  return (
    <FluentProvider theme={webLightTheme} className={styles.root}>
      <RiskActionFieldValue {...props} />
      <NewRiskActionDialog {...props} />
    </FluentProvider>
  )
  }