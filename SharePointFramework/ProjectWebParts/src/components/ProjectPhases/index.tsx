import { MessageBarType, Shimmer } from '@fluentui/react'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { ChangePhaseDialog } from './ChangePhaseDialog'
import { ProjectPhasesContext } from './context'
import { ProjectPhase } from './ProjectPhase'
import { ProjectPhaseCallout } from './ProjectPhase/ProjectPhaseCallout'
import styles from './ProjectPhases.module.scss'
import {
  HIDE_MESSAGE,
  OPEN_CALLOUT} from './reducer'
import { getShimmerElements } from './shimmer'
import { IProjectPhasesProps } from './types'
import { useProjectPhases } from './useProjectPhases'

export const ProjectPhases: FC<IProjectPhasesProps> = (props) => {
  const { rootRef, state, dispatch, onChangePhase } = useProjectPhases(props)

  if (state.hidden) return null

  if (state.error) {
    return (
      <UserMessage
        messageBarType={MessageBarType.severeWarning}
        onDismiss={() => dispatch(HIDE_MESSAGE())}
        text={strings.WebPartNoAccessMessage}
      />
    )
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.container}>
        <ProjectPhasesContext.Provider value={{ props, state, dispatch, onChangePhase }}>
          <Shimmer
            isDataLoaded={!state.loading}
            shimmerElements={getShimmerElements(rootRef.current?.clientWidth)}>
            <ul className={styles.phaseList}>
              {state.data.phases
                .filter((p) => p.isVisible)
                .map((phase, idx) => (
                  <ProjectPhase
                    key={idx}
                    phase={phase}
                    isCurrentPhase={phase.id === state.phase?.id}
                    onOpenCallout={(target) => dispatch(OPEN_CALLOUT({ phase, target }))}
                  />
                ))}
            </ul>
            <ProjectPhaseCallout {...(state.callout || {})} />
            <ChangePhaseDialog />
          </Shimmer>
        </ProjectPhasesContext.Provider>
      </div>
    </div>
  )
}

export * from './types'
