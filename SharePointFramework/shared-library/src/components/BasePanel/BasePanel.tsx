import { Panel, PanelType } from '@fluentui/react'
import { FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import React, { FC } from 'react'
import styles from './BasePanel.module.scss'
import { IBasePanelProps } from './types'
import { customLightTheme } from '../../util'
import strings from 'SharedLibraryStrings'

export const BasePanel: FC<IBasePanelProps> = (props) => {
  const fluentProviderId = useId('fp-base-panel')

  return (
    <Panel
      {...props}
      onRenderBody={() => {
        if (!props.onRenderBody) return null
        return (
          <IdPrefixProvider value={fluentProviderId}>
            <FluentProvider
              theme={customLightTheme}
              className={styles.root}
              applyStylesToPortals={false}
            >
              {props.onRenderBody()}
            </FluentProvider>
          </IdPrefixProvider>
        )
      }}
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
