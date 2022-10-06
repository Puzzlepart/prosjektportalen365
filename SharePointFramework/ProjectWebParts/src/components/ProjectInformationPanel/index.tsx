import { Panel, PanelType } from 'office-ui-fabric-react'
import React, { FunctionComponent } from 'react'
import { ProjectInformation } from '../ProjectInformation'
import { IProjectInformationPanelProps } from './types'

export const ProjectInformationPanel: FunctionComponent<IProjectInformationPanelProps> = (
  props
) => {
  return (
    <Panel
      type={PanelType.medium}
      {...props.panelProps}>
      <ProjectInformation {...props} />
    </Panel>
  )
}

export * from './types'
