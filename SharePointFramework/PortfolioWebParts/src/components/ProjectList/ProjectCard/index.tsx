import { DocumentCard, DocumentCardActions, Link } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useState } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardHeader } from './ProjectCardHeader'
import { ShimmeredCard } from './ShimmeredCard'
import { IProjectCardProps } from './types'

export const ProjectCard: FC<IProjectCardProps> = (props) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  if (props.shimmer || !isImageLoaded) return <ShimmeredCard height={300} />
  return (
    <DocumentCard
      className={styles.root}
      title={!props.project.userIsMember ? strings.NoAccessMessage : ''}
      onClickHref={props.project.userIsMember ? props.project.url : '#'}
      style={!props.project.userIsMember ? { opacity: '20%', cursor: 'default' } : {}}>
      <Link href={props.project.userIsMember ? props.project.url : '#'} target='_blank'>
        <ProjectCardHeader {...props} onImageLoad={() => setIsImageLoaded(true)} />
      </Link>
      <ProjectCardContent {...props} />
      <DocumentCardActions actions={props.actions} />
    </DocumentCard>
  )
}
