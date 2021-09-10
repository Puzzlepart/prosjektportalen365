import { DocumentCard } from 'office-ui-fabric-react/lib/DocumentCard'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FunctionComponent } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardFooter } from './ProjectCardFooter'
import { ProjectCardHeader } from './ProjectCardHeader'
import { IProjectCardProps } from './types'

export const ProjectCard: FunctionComponent<IProjectCardProps> = (props: IProjectCardProps) => {
  return (
    <DocumentCard
      title={props.project.readOnly ? strings.NoAccessMessage : ""}
      className={styles.projectCard}
      onClickHref={props.project.readOnly ? '#' : props.project.url}
      style={props.project.readOnly ? { opacity: '20%', cursor: 'default' } : {}}
    >
      <ProjectCardHeader {...props} />
      <ProjectCardContent {...props} />
      <ProjectCardFooter {...props} />
    </DocumentCard>
  )
}
