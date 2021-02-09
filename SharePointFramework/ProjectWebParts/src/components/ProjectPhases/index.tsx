import { UserMessage } from 'components/UserMessage'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { Spinner } from 'office-ui-fabric-react/lib/Spinner'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'ProjectWebPartsStrings'
import React, { useEffect, useReducer } from 'react'
import { changePhase } from './changePhase'
import { ChangePhaseDialog } from './ChangePhaseDialog'
import { ProjectPhasesContext } from './context'
import { fetchData } from './fetchData'
import { ProjectPhase } from './ProjectPhase'
import { ProjectPhaseCallout } from './ProjectPhase/ProjectPhaseCallout'
import styles from './ProjectPhases.module.scss'
import reducer, { HIDE_MESSAGE, initState, INIT_CHANGE_PHASE, INIT_DATA, OPEN_CALLOUT, SET_PHASE } from './reducer'
import { IProjectPhasesProps } from './types'

export const ProjectPhases = (props: IProjectPhasesProps) => {
  const [state, dispatch] = useReducer(reducer, initState())

  useEffect(() => {
    fetchData(props.phaseField).then(data => dispatch(INIT_DATA({ data })))
  }, [])

  if (state.hidden) return null

  if (state.isLoading) {
    return (
      <div className={styles.projectPhases}>
        <div className={styles.container}>
          <Spinner label={format(strings.LoadingText, 'fasevelger')} />
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <UserMessage
        messageBarType={MessageBarType.severeWarning}
        onDismiss={() => dispatch(HIDE_MESSAGE())}
        text={strings.WebPartNoAccessMessage}
      />
    )
  }

  /**
   * On change phase
   */
  const onChangePhase = async () => {
    dispatch(INIT_CHANGE_PHASE())
    await changePhase(
      state.confirmPhase,
      state.data.phaseTextField,
      props.currentPhaseViewName
    )
    dispatch(SET_PHASE({ phase: state.confirmPhase }))
    if (props.syncPropertiesAfterPhaseChange === undefined || props.syncPropertiesAfterPhaseChange) {
      setTimeout(
        () => (document.location.href = `${props.webUrl}#syncproperties=1`),
        1000
      )
    }
  }

  return (
    <ProjectPhasesContext.Provider value={{ props, state, dispatch, onChangePhase }}>
      <div className={styles.projectPhases}>
        <div className={styles.container}>
          <ul className={styles.phaseList}>
            {state.data.phases.filter((p) => p.isVisible).map((phase, idx) => (
              <ProjectPhase
                key={idx}
                phase={phase}
                isCurrentPhase={phase.id === state.phase?.id}
                onOpenCallout={(target) => dispatch(OPEN_CALLOUT({ phase, target }))}
              />
            ))}
          </ul>
        </div>
        <ProjectPhaseCallout {...state.callout || {}} />
        <ChangePhaseDialog />
      </div>
    </ProjectPhasesContext.Provider>
  )
}

export * from './types'
