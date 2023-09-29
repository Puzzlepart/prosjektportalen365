import { FluentProvider, useId, webLightTheme } from '@fluentui/react-components'
import React, { FC } from 'react'
import styles from './RiskAction.module.scss'
import { RiskActionFieldValue } from './RiskActionFieldValue'
import { RiskActionPopover } from './RiskActionPopover'
import { IRiskActionProps } from './types'

export const RiskAction: FC<IRiskActionProps> = (props) => {
    const fluentProviderId = useId('risk-action-fluent-provider')
    return (
        <FluentProvider
            id={fluentProviderId}
            theme={webLightTheme}
            className={styles.root}
            style={{ background: 'transparent' }}
        >
            <RiskActionPopover>
                <RiskActionFieldValue {...props} />
            </RiskActionPopover>
        </FluentProvider>
    )
}
