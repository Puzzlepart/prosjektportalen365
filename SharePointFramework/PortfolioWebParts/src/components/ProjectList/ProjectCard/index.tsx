import { Shimmer, ShimmerElementsGroup, ShimmerElementType } from '@fluentui/react'
import { Tooltip } from '@fluentui/react-components'
import { Card } from '@fluentui/react-components'
import React, { FC, useContext } from 'react'
import styles from './ProjectCard.module.scss'
import { ProjectCardFooter } from './ProjectCardFooter'
import { useProjectCard } from './useProjectCard'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardHeader } from './ProjectCardHeader'
import { ProjectCardContext } from './context'
import strings from 'PortfolioWebPartsStrings'

export const ProjectCard: FC = (props) => {
  const context = useContext(ProjectCardContext)
  const { isDataLoaded, setIsImageLoaded } = useProjectCard()

  return (
    <Shimmer
      className={styles.root}
      isDataLoaded={isDataLoaded}
      customElementsGroup={
        <div className={styles.shimmerGroup}>
          <ShimmerElementsGroup
            shimmerElements={[{ type: ShimmerElementType.line, width: '100%', height: 274 }]}
          />
        </div>
      }
    >
      <Card
        className={styles.card}
        {...props}
        floatingAction={
          context.project.phase && (
            <Tooltip
              content={
                <>
                  {strings.PhaseLabel}: <strong>{context.project.phase}</strong>
                </>
              }
              relationship={'description'}
              withArrow
            >
              <div className={styles.phaseBadge} title={context.project.phase}>
                {context.project.phase.slice(0, 1)}
              </div>
            </Tooltip>
          )
        }
      >
        <ProjectCardHeader onImageLoad={() => setIsImageLoaded(true)} />
        <ProjectCardContent />
        <ProjectCardFooter />
      </Card>
    </Shimmer>
  )
}
