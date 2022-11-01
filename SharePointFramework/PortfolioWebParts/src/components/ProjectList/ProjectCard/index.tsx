import { Shimmer, ShimmerElementsGroup, ShimmerElementType } from '@fluentui/react'
import React, { FC } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardFooter } from './ProjectCardFooter'
import { ProjectCardHeader } from './ProjectCardHeader'
import { useProjectCard } from './useProjectCard'

export const ProjectCard: FC = () => {
  const { isDataLoaded, setIsImageLoaded } = useProjectCard()
  return (
    <Shimmer
      className={styles.shimmer}
      isDataLoaded={isDataLoaded}
      customElementsGroup={
        <div>
          <div className={styles.shimmerGroup}>
            <ShimmerElementsGroup
              shimmerElements={[{ type: ShimmerElementType.line, width: '100%', height: 300 }]}
            />
          </div>
        </div>
      }>
      <div className={styles.root}>
        <ProjectCardHeader onImageLoad={() => setIsImageLoaded(true)} />
        <ProjectCardContent />
        <ProjectCardFooter />
      </div>
    </Shimmer>
  )
}
