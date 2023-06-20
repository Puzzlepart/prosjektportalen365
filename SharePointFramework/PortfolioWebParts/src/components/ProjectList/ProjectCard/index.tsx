import {
  DocumentCard,
  DocumentCardActions,
  Link,
  Shimmer,
  ShimmerElementsGroup,
  ShimmerElementType
} from '@fluentui/react'
import React, { FC, useContext } from 'react'
import { ProjectCardContext } from './context'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardHeader } from './ProjectCardHeader'
import { useProjectCard } from './useProjectCard'

export const ProjectCard: FC = () => {
  const context = useContext(ProjectCardContext)
  const { isDataLoaded, setIsImageLoaded, documentCardProps } = useProjectCard()
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
      }
    >
      <DocumentCard {...documentCardProps}>
        <Link href={documentCardProps.onClickHref} target='_blank'>
          <ProjectCardHeader onImageLoad={() => setIsImageLoaded(true)} />
        </Link>
        <ProjectCardContent />
        <DocumentCardActions actions={context.actions} />
      </DocumentCard>
    </Shimmer>
  )
}
