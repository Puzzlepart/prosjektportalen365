import React, { FC, useEffect } from 'react'
import { useBoolean } from 'usehooks-ts'
import { ProjectInformation } from '../ProjectInformation'
import { IProjectInformationPanelProps } from './types'
import { BasePanel } from 'pp365-shared-library'

export const ProjectInformationPanel: FC<IProjectInformationPanelProps> = (props) => {
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

ProjectInformationPanel.defaultProps = {
  hidden: true
}

export * from './types'
