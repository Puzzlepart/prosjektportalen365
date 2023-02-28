import { Shimmer } from '@fluentui/react'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
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
  const { rootRef, state, dispatch, onChangePhase } = useProjectPhases(props)

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.container}>
        <ProjectPhasesContext.Provider value={{ props, state, dispatch, onChangePhase }}>
          <Shimmer
            isDataLoaded={state.isDataLoaded || !!state.error}
            shimmerElements={getShimmerElements(rootRef.current?.clientWidth)}>
            <ul className={styles.phaseList}>
              {state.data.phases
                .filter((p) => p.isVisible)
                .map((phase, idx) => (
                  <ProjectPhase key={idx} phase={phase} />
                ))}
            </ul>
            <ProjectPhaseCallout {...(state.callout || {})} />
            <ChangePhaseDialog />
          </Shimmer>
        </ProjectPhasesContext.Provider>
        {state.error && (
          <UserMessage
            className={styles.userMessage}
            type={state.error.type}
            onDismiss={() => dispatch(DISMISS_ERROR_MESSAGE())}
            text={state.error.message}
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
