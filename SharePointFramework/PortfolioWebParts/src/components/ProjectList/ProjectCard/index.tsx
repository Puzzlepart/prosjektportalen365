import { DocumentCard } from 'office-ui-fabric-react/lib/DocumentCard'
import React from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardFooter } from './ProjectCardFooter'
import { ProjectCardHeader } from './ProjectCardHeader'
import { IProjectCardProps } from './types'

/**
 * Project Card
 *
 * @param {IProjectCardProps} props Props
 */
// tslint:disable-next-line: naming-convention
export const ProjectCard = (props: IProjectCardProps): JSX.Element => {
  return (
    <DocumentCard className={styles.projectCard} onClickHref={props.project.url}>
      <ProjectCardHeader {...props} />
      <ProjectCardContent {...props} />
      <ProjectCardFooter {...props} />
    </DocumentCard>
  )
}
