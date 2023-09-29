import { Shimmer } from '@fluentui/react'
import {
  Toast,
  ToastTitle,
  useId,
  useToastController
} from '@fluentui/react-components'
import { ThemedComponent } from 'pp365-shared-library'
import React, { FC } from 'react'
import { ChangePhaseDialog } from './ChangePhaseDialog'
import { ProjectPhase } from './ProjectPhase'
import styles from './ProjectPhases.module.scss'
import { ProjectPhasesContext } from './context'
import { getShimmerElements } from './shimmer'
import { IProjectPhasesProps } from './types'
import { useProjectPhases } from './useProjectPhases'

export const ProjectPhases: FC<IProjectPhasesProps> = (props) => {
  const { rootRef, context } = useProjectPhases(props)
  const toasterId = useId('toaster')

  const { dispatchToast } = useToastController(toasterId)

  return (
    <ProjectPhasesContext.Provider value={context}>
      <ThemedComponent
        className={styles.root}
        ref={rootRef}
      >
        <div className={styles.container}>
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
            <ChangePhaseDialog />
          </Shimmer>
          {context.state.error &&
            dispatchToast(
              <Toast>
                <ToastTitle>{context.state.error.message}</ToastTitle>
              </Toast>,
              { intent: 'error' }
            )}
        </div>
      </ThemedComponent>
    </ProjectPhasesContext.Provider>
  )
}
ProjectPhases.displayName = 'Project Phases'
ProjectPhases.defaultProps = {
  syncPropertiesAfterPhaseChange: true,
  commentMinLength: 4,
  subTextTruncateLength: 50
}

export * from './types'
