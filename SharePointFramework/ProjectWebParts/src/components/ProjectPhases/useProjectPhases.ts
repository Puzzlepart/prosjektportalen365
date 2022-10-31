import { useEffect, useReducer, useRef } from 'react'
import { changePhase } from './changePhase'
import { fetchData } from './fetchData'
import reducer, { initialState, INIT_CHANGE_PHASE, INIT_DATA, SET_PHASE } from './reducer'
import { IProjectPhasesProps } from './types'

/**
 * Component logic hook for `ProjectPhases`
 */
export function useProjectPhases(props: IProjectPhasesProps) {
  const rootRef = useRef(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    fetchData(props).then((data) => dispatch(INIT_DATA({ data })))
  }, [])

  /**
   * On change phase
   */
  const onChangePhase = async () => {
    dispatch(INIT_CHANGE_PHASE())
    await changePhase(
      state.confirmPhase,
      state.data.phaseTextField,
      props,
      state.data.phaseSitePages
    )
    dispatch(SET_PHASE({ phase: state.confirmPhase }))
    if (
      props.syncPropertiesAfterPhaseChange === undefined ||
      props.syncPropertiesAfterPhaseChange
    ) {
      const currentUrlIsPageRelative =
        document.location.pathname.indexOf(state.data.welcomePage) > -1
      const welcomepage = !currentUrlIsPageRelative
        ? `${document.location.pathname}/${state.data.welcomePage}`
        : document.location.pathname
      setTimeout(() => {
        window.location.assign(
          `${document.location.protocol}//${document.location.hostname}${welcomepage}#syncproperties=1`
        )
        if (currentUrlIsPageRelative) {
          window.location.reload()
        }
      }, 1000)
    }
  }

  return { rootRef, state, dispatch, onChangePhase } as const
}
