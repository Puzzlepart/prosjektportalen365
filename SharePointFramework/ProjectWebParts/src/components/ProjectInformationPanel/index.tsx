import React, { FC, useEffect } from 'react'
import { useBoolean } from 'usehooks-ts'
import { ProjectInformation } from '../ProjectInformation'
import { IProjectInformationPanelProps } from './types'
import { BasePanel, withDefaults } from 'pp365-shared-library'

const PROJECT_INFORMATION_PANEL_DEFAULT_PROPS: Partial<IProjectInformationPanelProps> = {
  hidden: true
}

export const ProjectInformationPanel: FC<IProjectInformationPanelProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, PROJECT_INFORMATION_PANEL_DEFAULT_PROPS)
  const panelState = useBoolean(!props.hidden)

  useEffect(() => {
    if (!props.onRenderToggleElement) panelState.setValue(!props.hidden)
  }, [props.hidden])

  return (
    <>
      {props.children}
      {props.onRenderToggleElement && props.onRenderToggleElement(panelState.toggle)}
      {/* The title goes in the drawer's header, on the close button's line, not in the body. */}
      <BasePanel
        open={panelState.value}
        size={'medium'}
        isLightDismiss={true}
        onClose={panelState.setFalse}
        headerText={props.title}
        {...props.panelProps}
      >
        <ProjectInformation {...props} hideTitle />
      </BasePanel>
    </>
  )
}

export * from './types'
