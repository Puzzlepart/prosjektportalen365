import { Panel, PanelType } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../context'
import { CLOSE_PANEL } from '../reducer'
import { IBasePanelProps } from './types'
import { FluentProvider, useId, webLightTheme } from '@fluentui/react-components'
import styles from './BasePanel.module.scss'

export const BasePanel: FC<IBasePanelProps> = (props) => {
  const fluentProviderId = useId('fluent-provider')
  const context = useProjectInformationContext()

  return (
    <Panel
      {...props}
      isOpen={context.state.activePanel === props.$type}
      onRenderBody={() => {
        if (!props.onRenderBody) return null
        return (
          <FluentProvider
            id={fluentProviderId}
            theme={webLightTheme}
            className={styles.root}
          >
            {props.onRenderBody()}
          </FluentProvider>
        )
      }}
      onDismiss={() => context.dispatch(CLOSE_PANEL())}
    >
      {props.children}
    </Panel>
  )
}

BasePanel.defaultProps = {
  type: PanelType.medium,
  isLightDismiss: true,
  closeButtonAriaLabel: strings.CloseText
}

export * from './ClosePanelButton'
