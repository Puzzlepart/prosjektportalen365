import { DocumentCard } from '@fluentui/react/lib/DocumentCard'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FunctionComponent } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardFooter } from './ProjectCardFooter'
import { ProjectCardHeader } from './ProjectCardHeader'
import { IProjectCardProps } from './types'

export const ProjectCard: FunctionComponent<IProjectCardProps> = (props) => {
  return (
    <DocumentCard
      title={!props.project.userIsMember ? strings.NoAccessMessage : ''}
      className={styles.projectCard}
      onClickHref={props.project.userIsMember ? props.project.url : '#'}
      style={!props.project.userIsMember ? { opacity: '20%', cursor: 'default' } : {}}>
      <ProjectCardHeader {...props} />
      <ProjectCardContent {...props} />
      <ProjectCardFooter {...props} />
    </DocumentCard>
  )
}
