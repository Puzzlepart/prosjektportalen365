import { Panel, PanelType } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../context'
import { CLOSE_PANEL } from '../reducer'
import { IBasePanelProps } from './types'

export const BasePanel: FC<IBasePanelProps> = (props) => {
  const context = useProjectInformationContext()
  return (
    <Panel
      {...props}
      isOpen={context.state.activePanel === props.$type}
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