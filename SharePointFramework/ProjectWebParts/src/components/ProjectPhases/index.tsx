import { Shimmer } from '@fluentui/react'
import React, { FC } from 'react'
import { ChangePhaseDialog } from './ChangePhaseDialog/ChangePhaseDialog'
import { ProjectPhasesContext } from './context'
import { ProjectPhase } from './ProjectPhase'
import styles from './ProjectPhases.module.scss'
import { getShimmerElements } from './shimmer'
import { IProjectPhasesProps } from './types'
import { useProjectPhases } from './useProjectPhases'
import {
  FluentProvider,
  Toast,
  ToastTitle,
  useId,
  useToastController,
  webLightTheme
} from '@fluentui/react-components'

export const ProjectPhases: FC<IProjectPhasesProps> = (props) => {
  const { rootRef, context } = useProjectPhases(props)
  const toasterId = useId('toaster')
  const fluentProviderId = useId('fluent-provider')

  const { dispatchToast } = useToastController(toasterId)

  return (
    <FluentProvider
      id={fluentProviderId}
      theme={webLightTheme}
      className={styles.root}
      ref={rootRef}
    >
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
            <ChangePhaseDialog />
          </Shimmer>
        </ProjectPhasesContext.Provider>
        {context.state.error &&
          dispatchToast(
            <Toast>
              <ToastTitle>{context.state.error.message}</ToastTitle>
            </Toast>,
            { intent: 'error' }
          )}
      </div>
    </FluentProvider>
  )
}
ProjectPhases.displayName = 'Project Phases'
ProjectPhases.defaultProps = {
  syncPropertiesAfterPhaseChange: true,
  commentMinLength: 4,
  subTextTruncateLength: 50
}

export * from './types'
