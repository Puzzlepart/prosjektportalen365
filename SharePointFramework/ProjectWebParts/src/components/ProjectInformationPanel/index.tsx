import { Panel, PanelType } from 'office-ui-fabric-react'
import React, { FunctionComponent, useState } from 'react'
import { ProjectInformation } from '../ProjectInformation'
import { IProjectInformationPanelProps } from './types'

export const ProjectInformationPanel: FunctionComponent<IProjectInformationPanelProps> = (
  props
) => {
  const [showPanel, setShowPanel] = useState(false)
  return (
    <>
      {props.children}
      {props.onRenderToggleElement(() => setShowPanel(!showPanel))}
      <Panel
        isOpen={showPanel}
        type={PanelType.medium}
        onDismiss={() => setShowPanel(false)}
        isLightDismiss={true}
        {...props.panelProps}>
        <ProjectInformation {...props} />
      </Panel>
    </>
  )
}

export * from './types'
