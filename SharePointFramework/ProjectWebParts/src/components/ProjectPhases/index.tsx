import { Shimmer } from '@fluentui/react'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { ChangePhaseDialog } from './ChangePhaseDialog'
import { ProjectPhasesContext } from './context'
import { ProjectPhase } from './ProjectPhase'
import { ProjectPhaseCallout } from './ProjectPhase/ProjectPhaseCallout'
import styles from './ProjectPhases.module.scss'
import { DISMISS_ERROR_MESSAGE } from './reducer'
import { getShimmerElements } from './shimmer'
import { IProjectPhasesProps } from './types'
import { useProjectPhases } from './useProjectPhases'

export const ProjectPhases: FC<IProjectPhasesProps> = (props) => {
  const { rootRef, context } = useProjectPhases(props)

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.container}>
        <ProjectPhasesContext.Provider value={context}>
          <Shimmer
            isDataLoaded={context.state.isDataLoaded || !!context.state.error}
            shimmerElements={getShimmerElements(rootRef.current?.clientWidth)}
          >
            <ul className={styles.phaseList}>
              {context.state.data.phases
                .filter((p) => p.isVisible)
                .map((phase, idx) => (
                  <ProjectPhase key={idx} phase={phase} />
                ))}
            </ul>
            <ProjectPhaseCallout {...(context.state.callout || {})} />
            <ChangePhaseDialog />
          </Shimmer>
        </ProjectPhasesContext.Provider>
        {context.state.error && (
          <UserMessage
            className={styles.userMessage}
            type={context.state.error.type}
            onDismiss={() => context.dispatch(DISMISS_ERROR_MESSAGE())}
            text={context.state.error.message}
          />
        )}
      </div>
    </div>
  )
}
ProjectPhases.displayName = 'Project Phases'
ProjectPhases.defaultProps = {
  syncPropertiesAfterPhaseChange: true,
  commentMinLength: 4
}

export * from './types'
