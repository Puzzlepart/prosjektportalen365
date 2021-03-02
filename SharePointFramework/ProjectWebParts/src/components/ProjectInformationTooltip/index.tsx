import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip'
import React, { FunctionComponent } from 'react'
import { ProjectInformation } from '../ProjectInformation'
import styles from './ProjectInformationTooltip.module.scss'
import { IProjectInformationTooltipProps } from './types'

export const ProjectInformationTooltip: FunctionComponent<IProjectInformationTooltipProps> = (
  props: IProjectInformationTooltipProps
) => {
  return (
    <TooltipHost
      {...props.tooltipProps}
      calloutProps={{ calloutMaxWidth: 500 }}
      content={
        <div className={styles.root}>
          <ProjectInformation {...props} />
        </div>
      }>
      {props.children}
    </TooltipHost>
  )
}

export * from './types'
