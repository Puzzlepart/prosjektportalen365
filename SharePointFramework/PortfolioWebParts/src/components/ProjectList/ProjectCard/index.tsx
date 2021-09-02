import { DocumentCard } from 'office-ui-fabric-react/lib/DocumentCard'
import React, { FunctionComponent } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardFooter } from './ProjectCardFooter'
import { ProjectCardHeader } from './ProjectCardHeader'
import { IProjectCardProps } from './types'
import * as strings from 'PortfolioWebPartsStrings'
import { TooltipHost } from 'office-ui-fabric-react'

export const ProjectCard: FunctionComponent<IProjectCardProps> = (props: IProjectCardProps) => {
  return (
    <TooltipHost
    content = {props.project.readOnly && (strings.NoAccessMessage)} 
    >
    <DocumentCard
    className={styles.projectCard}
    onClickHref={props.project.readOnly ? '#' : props.project.url}
    style={props.project.readOnly ? { opacity: "20%", cursor: "default" } : { opacity: "100%"}}
    >
      <ProjectCardHeader {...props} />
      <ProjectCardContent {...props} />
      <ProjectCardFooter {...props} />
    </DocumentCard>
      </TooltipHost>
  )
}
