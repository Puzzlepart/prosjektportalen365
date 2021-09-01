import { DocumentCard } from 'office-ui-fabric-react/lib/DocumentCard'
import React, { FunctionComponent } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardFooter } from './ProjectCardFooter'
import { ProjectCardHeader } from './ProjectCardHeader'
import { IProjectCardProps } from './types'
import * as strings from 'PortfolioWebPartsStrings'

export const ProjectCard: FunctionComponent<IProjectCardProps> = (props: IProjectCardProps) => {
  return (
    <DocumentCard
      className={styles.projectCard}
      onClickHref={props.project.readOnly ? '#' : props.project.url}
      onClick={() => props.project.readOnly && alert(strings.NoAccessMessage)}
      style={props.project.readOnly && { opacity: "20%", cursor: "not-allowed" }}
      >
      <ProjectCardHeader {...props} />
      <ProjectCardContent {...props} />
      <ProjectCardFooter {...props} />
    </DocumentCard>
  )
}
