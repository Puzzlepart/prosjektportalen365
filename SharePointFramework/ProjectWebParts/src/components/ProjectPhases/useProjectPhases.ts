import SPDataAdapter from 'data/SPDataAdapter'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import strings from 'ProjectWebPartsStrings'
import { useReducer, useRef } from 'react'
import { ProjectPhases } from '.'
import { changePhase } from './changePhase'
import reducer, { CHANGE_PHASE_ERROR, initialState, INIT_CHANGE_PHASE, SET_PHASE } from './reducer'
import { IProjectPhasesProps } from './types'
import { useProjectPhasesDataFetch } from './useProjectPhasesDataFetch'

/**
 * Component logic hook for `ProjectPhases`
 */
export function useProjectPhases(props: IProjectPhasesProps) {
  const rootRef = useRef(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  ListLogger.init(
    SPDataAdapter.portal.web.lists.getByTitle(strings.LogListName),
    props.webPartContext.pageContext.web.absoluteUrl,
    ProjectPhases.displayName
  )

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

  useProjectPhasesDataFetch(props, dispatch)

  return { rootRef, state, dispatch, onChangePhase } as const
}
