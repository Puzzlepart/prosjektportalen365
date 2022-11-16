import { ListLogger } from 'pp365-shared/lib/logging'
import { useEffect, useReducer, useRef } from 'react'
import { ProjectPhases } from '.'
import { changePhase } from './changePhase'
import { fetchData } from './fetchData'
import reducer, {
  CHANGE_PHASE_ERROR,
  initialState,
  INIT_CHANGE_PHASE,
  INIT_DATA,
  SET_PHASE
} from './reducer'
import { IProjectPhasesProps } from './types'

/**
 * Component logic hook for `ProjectPhases`
 */
export function useProjectPhases(props: IProjectPhasesProps) {
  const rootRef = useRef(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  ListLogger.init(
    props.hubSite.web.lists.getByTitle('Logg'),
    props.webPartContext.pageContext.web.absoluteUrl,
    ProjectPhases.displayName
  )

  useEffect(() => {
    fetchData(props)
      .then((data) => dispatch(INIT_DATA({ data })))
      .catch((error) => dispatch(INIT_DATA({ data: null, error })))
  }, [])

  /**
   * On change phase
   */
  const onChangePhase = async () => {
    dispatch(INIT_CHANGE_PHASE())
    try {
      await changePhase(
        state.confirmPhase,
        state.data.phaseTextField,
        props,
        state.data.phaseSitePages
      )
      dispatch(SET_PHASE({ phase: state.confirmPhase }))
      if (props.syncPropertiesAfterPhaseChange) {
        const currentUrlIsPageRelative =
          document.location.pathname.indexOf(state.data.welcomePage) > -1
        const welcomePage = !currentUrlIsPageRelative
          ? `${document.location.pathname}/${state.data.welcomePage}`
          : document.location.pathname
        setTimeout(() => {
          window.location.assign(
            `${document.location.protocol}//${document.location.hostname}${welcomePage}#syncproperties=1`
          )
          if (currentUrlIsPageRelative) window.location.reload()
        }, 1000)
      }
    } catch (error) {
      dispatch(CHANGE_PHASE_ERROR({ error }))
    }
  }

  return { rootRef, state, dispatch, onChangePhase } as const
}
