import { DocumentCard, DocumentCardActions, Link } from '@fluentui/react'
import React, { FC } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardHeader } from './ProjectCardHeader'
import { ShimmeredCard } from './ShimmeredCard'
import { IProjectCardProps } from './types'
import { useProjectCard } from './useProjectCard'

export const ProjectCard: FC<IProjectCardProps> = (props) => {
  const { shimmer, setIsImageLoaded, title, href, style } = useProjectCard(props)
  if (shimmer) return <ShimmeredCard height={300} />
  return (
    <DocumentCard className={styles.root} title={title} onClickHref={href} style={style}>
      <Link href={href} target='_blank'>
        <ProjectCardHeader {...props} onImageLoad={() => setIsImageLoaded(true)} />
      </Link>
      <ProjectCardContent {...props} />
      <DocumentCardActions actions={props.actions} />
    </DocumentCard>
  )
}

ProjectCard.defaultProps = {
  project: {},
  shimmer: true
}
