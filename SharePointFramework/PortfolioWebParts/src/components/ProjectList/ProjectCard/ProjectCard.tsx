import { Card, Skeleton, SkeletonItem, Tooltip } from '@fluentui/react-components'
import { DismissCircle20Regular } from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectCardContext } from './context'
import styles from './ProjectCard.module.scss'
import { ProjectCardContent } from './ProjectCardContent'
import { ProjectCardFooter } from './ProjectCardFooter'
import { ProjectCardHeader } from './ProjectCardHeader'
import { useProjectCard } from './useProjectCard'

export const ProjectCard: FC = (props) => {
  const context = useContext(ProjectCardContext)
  const { isDataLoaded, setIsImageLoaded } = useProjectCard()
  const phase = context.project?.phase ? context.project.phase : strings.NotSet

  if (!isDataLoaded) {
    return (
      <div className={styles.root}>
        <div className={styles.shimmerGroup}>
          <Skeleton>
            <SkeletonItem style={{ width: '100%', height: 274 }} />
          </Skeleton>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <Card
        className={styles.card}
        {...props}
        floatingAction={
          context.shouldDisplay('ProjectPhase') && (
            <Tooltip
              content={
                <>
                  {strings.PhaseLabel}: <strong>{phase}</strong>
                </>
              }
              relationship='description'
              withArrow
            >
              <div className={styles.phaseBadge} title={phase}>
                {phase === strings.NotSet ? <DismissCircle20Regular /> : phase.slice(0, 1)}
              </div>
            </Tooltip>
          )
        }
      >
        <ProjectCardHeader onImageLoad={() => setIsImageLoaded(true)} />
        <ProjectCardContent />
        <ProjectCardFooter />
      </Card>
    </div>
  )
}
