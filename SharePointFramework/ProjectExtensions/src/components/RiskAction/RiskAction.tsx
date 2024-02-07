import { FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import styles from './RiskAction.module.scss'
import { RiskActionFieldValue } from './RiskActionFieldValue'
import { RiskActionPopover } from './RiskActionPopover'
import { RiskActionContext } from './context'
import { useRiskAction } from './useRiskAction'

export const RiskAction: FC = () => {
  const { fluentProviderId, contextValue } = useRiskAction()
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider
        theme={customLightTheme}
        className={styles.root}
        style={{ background: 'transparent' }}
      >
        <RiskActionContext.Provider value={contextValue}>
          <RiskActionPopover>
            <RiskActionFieldValue />
          </RiskActionPopover>
        </RiskActionContext.Provider>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
