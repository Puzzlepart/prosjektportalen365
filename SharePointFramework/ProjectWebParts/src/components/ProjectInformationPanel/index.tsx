import { Panel } from 'office-ui-fabric-react'
import React, { FunctionComponent } from 'react'
import { ProjectInformation } from '../ProjectInformation'
import styles from './ProjectInformationPanel.module.scss'
import { IProjectInformationPanelProps } from './types'

export const ProjectInformationPanel: FunctionComponent<IProjectInformationPanelProps> = (
  props
) => {
  return (
    <Panel {...props.panelProps}>
      <div className={styles.root}>
        <ProjectInformation {...props} />
      </div>
    </Panel>
  )
}

export * from './types'