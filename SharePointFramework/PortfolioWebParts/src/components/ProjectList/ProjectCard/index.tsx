import { DocumentCard } from 'office-ui-fabric-react/lib/DocumentCard'
import React, { FunctionComponent } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardFooter } from './ProjectCardFooter'
import { ProjectCardHeader } from './ProjectCardHeader'
import { IProjectCardProps } from './types'

export const ProjectCard: FunctionComponent<IProjectCardProps> = (props: IProjectCardProps) => {
  return (
    <DocumentCard className={styles.projectCard} onClickHref={props.project.url}>
      <ProjectCardHeader {...props} />
      <ProjectCardContent {...props} />
      <ProjectCardFooter {...props} />
    </DocumentCard>
  )
}
