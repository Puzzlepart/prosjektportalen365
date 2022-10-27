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
  const { isDataLoaded, setIsImageLoaded, documentCardProps } = useProjectCard(props)
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
      <DocumentCard {...documentCardProps}>
        <Link href={documentCardProps.onClickHref} target='_blank'>
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
