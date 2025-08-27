import React, { FC } from 'react'
import { ChangePhaseDialog } from './ChangePhaseDialog/ChangePhaseDialog'
import { ProjectPhasesContext } from './context'
import { ProjectPhase } from './ProjectPhase'
import styles from './ProjectPhases.module.scss'
import { IProjectPhasesProps } from './types'
import { useProjectPhases } from './useProjectPhases'
import {
  FluentProvider,
  IdPrefixProvider,
  Toast,
  ToastTitle,
  useToastController
} from '@fluentui/react-components'
import { LoadingSkeleton, customLightTheme } from 'pp365-shared-library'

export const ProjectPhases: FC<IProjectPhasesProps> = (props) => {
  const { rootRef, context, fluentProviderId, toasterId } = useProjectPhases(props)
  const { dispatchToast } = useToastController(toasterId)
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.root} ref={rootRef}>
        <div className={styles.container}>
          <ProjectPhasesContext.Provider value={context}>
            {context.state.isDataLoaded || !!context.state.error ? (
              <>
                <ul className={styles.phaseList}>
                  {context.state.data.phases
                    .filter((p) => p.isVisible)
                    .map((phase, idx, phases) => {
                      if (
                        phase.isEndPhase &&
                        context.state.phase?.id !== phases[phases.length - 2]?.id &&
                        context.state.phase?.id !== phases[phases.length - 1]?.id
                      ) {
                        return null
                      }

                      return <ProjectPhase key={idx} phase={phase} />
                    })}
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
    </IdPrefixProvider>
  )
}
ProjectPhases.displayName = 'Project Phases'
ProjectPhases.defaultProps = {
  syncPropertiesAfterPhaseChange: true,
  commentMinLength: 4,
  subTextTruncateLength: 50
}
