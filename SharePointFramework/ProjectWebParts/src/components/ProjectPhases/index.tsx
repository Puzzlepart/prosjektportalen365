import { UserMessage } from 'components/UserMessage'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { Shimmer } from 'office-ui-fabric-react/lib/Shimmer'
import * as strings from 'ProjectWebPartsStrings'
import React, { useEffect, useReducer, useRef } from 'react'
import { changePhase } from './changePhase'
import { ChangePhaseDialog } from './ChangePhaseDialog'
import { ProjectPhasesContext } from './context'
import { fetchData } from './fetchData'
import { ProjectPhase } from './ProjectPhase'
import { ProjectPhaseCallout } from './ProjectPhase/ProjectPhaseCallout'
import styles from './ProjectPhases.module.scss'
import reducer, {
  HIDE_MESSAGE,
  initState,
  INIT_CHANGE_PHASE,
  INIT_DATA,
  OPEN_CALLOUT,
  SET_PHASE
} from './reducer'
import { getShimmerElements } from './shimmer'
import { IProjectPhasesProps } from './types'

export const ProjectPhases = (props: IProjectPhasesProps) => {
  const root = useRef(null)
  const [state, dispatch] = useReducer(reducer, initState())

  useEffect(() => {
    fetchData(props).then((data) => dispatch(INIT_DATA({ data })))
  }, [])

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

  /**
   * On change phase
   */
  const onChangePhase = async () => {
    dispatch(INIT_CHANGE_PHASE())
    await changePhase(state.confirmPhase, state.data.phaseTextField, props, state.data.phaseSitePages)
    dispatch(SET_PHASE({ phase: state.confirmPhase }))
    if (
      props.syncPropertiesAfterPhaseChange === undefined ||
      props.syncPropertiesAfterPhaseChange
    ) {
      setTimeout(
        () =>
          {
            document.location.href = `${document.location.protocol}//${document.location.hostname}${document.location.pathname}#syncproperties=1`
            window.location.reload()
          },
        1000
      )
    }
  }

  return (
    <div className={styles.root} ref={root}>
      <div className={styles.container}>
        <ProjectPhasesContext.Provider value={{ props, state, dispatch, onChangePhase }}>
          <Shimmer
            isDataLoaded={!state.loading}
            shimmerElements={getShimmerElements(root.current?.clientWidth)}>
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
            <ChangePhaseDialog data={state.data} />
          </Shimmer>
        </ProjectPhasesContext.Provider>
      </div>
    </div>
  )
}

export * from './types'
