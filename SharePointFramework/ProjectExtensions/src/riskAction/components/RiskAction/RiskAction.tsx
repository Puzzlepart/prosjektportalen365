import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import React, { FC } from 'react'
import styles from './RiskAction.module.scss'
import { RiskActionFieldValue } from './RiskActionFieldValue'
import { RiskActionPopover } from './RiskActionPopover'
import { RiskActionContext } from './context'
import { useRiskAction } from './useRiskAction'

export const RiskAction: FC = () => {
  const { fluentProviderId, context } = useRiskAction()
  return (
    <FluentProvider
      id={fluentProviderId}
      theme={webLightTheme}
      className={styles.root}
      style={{ background: 'transparent' }}
    >
      <RiskActionContext.Provider value={context}>
        <RiskActionPopover>
          <RiskActionFieldValue />
        </RiskActionPopover>
      </RiskActionContext.Provider>
    </FluentProvider>
  )
}
