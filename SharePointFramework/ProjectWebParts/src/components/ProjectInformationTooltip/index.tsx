import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip'
import React, { FunctionComponent } from 'react'
import { ProjectInformation } from '../ProjectInformation'
import styles from './ProjectInformationModal.module.scss'
import { IProjectInformationTooltipProps } from './types'

export const ProjectInformationTooltip: FunctionComponent<IProjectInformationTooltipProps> = (props: IProjectInformationTooltipProps) => {
  return (
    <TooltipHost {...props.tooltipProps} className={styles.root}>
      <ProjectInformation {...props} />
    </TooltipHost>
  )
}

export * from './types'
