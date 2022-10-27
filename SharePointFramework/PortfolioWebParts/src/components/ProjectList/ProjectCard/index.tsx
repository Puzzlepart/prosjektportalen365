import {
  DocumentCard,
  DocumentCardActions,
  Link,
  Shimmer,
  ShimmerElementsGroup,
  ShimmerElementType
} from '@fluentui/react'
import { ProjectListModel } from 'models'
import React, { FC } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardHeader } from './ProjectCardHeader'
import { IProjectCardProps } from './types'
import { useProjectCard } from './useProjectCard'

export const ProjectCard: FC<IProjectCardProps> = (props) => {
  const { isDataLoaded, setIsImageLoaded, title, href, style } = useProjectCard(props)
  return (
    <Shimmer
      className={styles.root}
      isDataLoaded={isDataLoaded}
      customElementsGroup={
        <div>
          <div className={styles.shimmerGroup}>
            <ShimmerElementsGroup
              shimmerElements={[{ type: ShimmerElementType.line, width: '100%', height: 440 }]}
            />
          </div>
        </div>
      }>
      <DocumentCard className={styles.root} title={title} onClickHref={href} style={style}>
        <Link href={href} target='_blank'>
          <ProjectCardHeader {...props} onImageLoad={() => setIsImageLoaded(true)} />
        </Link>
        <ProjectCardContent {...props} />
        <DocumentCardActions actions={props.actions} />
      </DocumentCard>
    </Shimmer>
  )
}

ProjectCard.defaultProps = {
  project: new ProjectListModel(undefined, {}),
  isDataLoaded: true,
  showProjectOwner: true,
  showProjectManager: true,
  shouldTruncateTitle: true
}
