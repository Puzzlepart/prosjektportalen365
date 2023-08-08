import strings from 'ProjectWebPartsStrings'
import SPDataAdapter from 'data/SPDataAdapter'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { useReducer, useRef } from 'react'
import { ProjectPhases } from '.'
import { IProjectPhasesContext } from './context'
import reducer, { initialState } from './reducer'
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

  useProjectPhasesDataFetch(props, dispatch)

  const context: IProjectPhasesContext = {
    state,
    props,
    dispatch
  }

  return { rootRef, context } as const
}
