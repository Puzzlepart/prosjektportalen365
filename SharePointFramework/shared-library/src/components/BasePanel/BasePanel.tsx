import { Panel, PanelType } from '@fluentui/react'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import React, { FC } from 'react'
import styles from './BasePanel.module.scss'
import { IBasePanelProps } from './types'

export const BasePanel: FC<IBasePanelProps> = (props) => {
  return (
    <Panel
      {...props}
      onRenderBody={() => {
        if (!props.onRenderBody) return null
        return (
          <FluentProvider theme={webLightTheme} className={styles.root} applyStylesToPortals={false}>
            {props.onRenderBody()}
          </FluentProvider>
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
  closeButtonAriaLabel: 'strings.CloseText'
}
