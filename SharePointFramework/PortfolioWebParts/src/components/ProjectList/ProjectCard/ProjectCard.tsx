import { Shimmer, ShimmerElementsGroup, ShimmerElementType } from '@fluentui/react'
import {
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Tooltip
} from '@fluentui/react-components'
import { Delete20Regular, DismissCircle20Regular } from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext, useState } from 'react'
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
  const showDeadAdminUI =
    !!context.project?.isDead && !!context.isUserInPortfolioManagerGroup
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const renderFloatingAction = () => {
    if (showDeadAdminUI) {
      return (
        <Tooltip
          content={strings.DeadProjectTooltip}
          relationship='description'
          withArrow
        >
          <Button
            appearance='subtle'
            icon={<Delete20Regular />}
            aria-label={strings.DeleteDeadProjectConfirmTitle}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setConfirmOpen(true)
            }}
          />
        </Tooltip>
      )
    }
    if (context.shouldDisplay('ProjectPhase')) {
      return (
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
    return null
  }

  return (
    <Shimmer
      className={styles.root}
      isDataLoaded={isDataLoaded}
      customElementsGroup={
        <div className={styles.shimmerGroup}>
          <ShimmerElementsGroup
            shimmerElements={[
              {
                type: ShimmerElementType.line,
                width: '100%',
                height: 274
              }
            ]}
          />
        </div>
      }
    >
      <Card
        className={`${styles.card} ${context.project?.isDead ? styles.dead : ''}`}
        {...props}
        floatingAction={renderFloatingAction()}
      >
        <ProjectCardHeader onImageLoad={() => setIsImageLoaded(true)} />
        <ProjectCardContent />
        <ProjectCardFooter />
      </Card>
      {showDeadAdminUI && (
        <Dialog
          open={confirmOpen}
          onOpenChange={(_, data) => !isDeleting && setConfirmOpen(data.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>{strings.DeleteDeadProjectConfirmTitle}</DialogTitle>
              <DialogContent>
                {strings.DeleteDeadProjectConfirmMessage}
                {context.project?.title && (
                  <>
                    <br />
                    <strong>{context.project.title}</strong>
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance='secondary' disabled={isDeleting}>
                    {strings.CancelButtonLabel}
                  </Button>
                </DialogTrigger>
                <Button
                  appearance='primary'
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true)
                    try {
                      await context.onDeleteDeadProject?.(context.project)
                    } finally {
                      setIsDeleting(false)
                      setConfirmOpen(false)
                    }
                  }}
                >
                  {strings.DeleteButtonLabel}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </Shimmer>
  )
}
