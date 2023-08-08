import { Shimmer, ShimmerElementsGroup, ShimmerElementType } from '@fluentui/react'
import { Card } from '@fluentui/react-components'
import React, { FC } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardFooter } from './ProjectCardFooter'
import { useProjectCard } from './useProjectCard'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardHeader } from './ProjectCardHeader'

export const ProjectCard: FC = (props) => {
  const { isDataLoaded, setIsImageLoaded } = useProjectCard()

  return (
    <Shimmer
      className={styles.root}
      isDataLoaded={isDataLoaded}
      customElementsGroup={
        <div className={styles.shimmerGroup}>
          <ShimmerElementsGroup
            shimmerElements={[{ type: ShimmerElementType.line, width: '100%', height: 312 }]}
          />
        </div>
      }
    >
      <Card className={styles.card} {...props}>
        <ProjectCardHeader onImageLoad={() => setIsImageLoaded(true)} />
        <ProjectCardContent />
        <ProjectCardFooter />
      </Card>
    </Shimmer>
  )
}
