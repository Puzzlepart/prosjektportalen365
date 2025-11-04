import SPDataAdapter from 'data/SPDataAdapter'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { useReducer, useRef } from 'react'
import { ProjectPhases } from '.'
import { IProjectPhasesContext } from './context'
import reducer, { initialState } from './reducer'
import { IProjectPhasesProps } from './types'
import { useProjectPhasesDataFetch } from './useProjectPhasesDataFetch'
import { useId } from '@fluentui/react-components'
import resource from 'SharedResources'

/**
 * Component logic hook for `ProjectPhases`
 */
export function useProjectPhases(props: IProjectPhasesProps) {
  const rootRef = useRef(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  ListLogger.init(
    SPDataAdapter.portalDataService.web.lists.getByTitle(resource.Lists_Log_Title),
    props.webAbsoluteUrl,
    ProjectPhases.displayName
  )

  useProjectPhasesDataFetch(props, dispatch)

  const context: IProjectPhasesContext = {
    state,
    props,
    dispatch
  }

  const fluentProviderId = useId('fp-project-phases')
  const toasterId = useId('toaster')

  return { rootRef, context, fluentProviderId, toasterId } as const
}
