import React, { FC } from 'react'
import { ChangePhaseDialog } from './ChangePhaseDialog/ChangePhaseDialog'
import { ProjectPhasesContext } from './context'
import { ProjectPhase } from './ProjectPhase'
import styles from './ProjectPhases.module.scss'
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
import { LoadingSkeleton } from 'pp365-shared-library'

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
          {context.state.isDataLoaded || !!context.state.error ? (
            <>
              <ul className={styles.phaseList}>
                {context.state.data.phases
                  .filter((p) => p.isVisible)
                  .map((phase, idx) => (
                    <ProjectPhase key={idx} phase={phase} />
                  ))}
              </ul>
              <ChangePhaseDialog />
            </>
          ) : (
            <LoadingSkeleton />
          )}
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
