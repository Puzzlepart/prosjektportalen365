/* eslint-disable prefer-spread */
import { PortalDataService } from 'pp365-shared/lib/services/PortalDataService'
import { ProviderProps, useReducer } from 'react'
import { IProjectStatusContext } from './context'
import reducer, { initialState } from './reducer'
import { IProjectStatusProps } from './types'
import { useProjectStatusDataFetch } from './useProjectStatusDataFetch'

/**
 * Component logic hook for `ProjectStatus`
 */
export function useProjectStatus(props: IProjectStatusProps) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const portalDataService = new PortalDataService().configure({
    spfxContext: props.spfxContext,
    url: props.hubSiteContext.url
  })

  useProjectStatusDataFetch(props, dispatch)

  const value:IProjectStatusContext = { props, state, dispatch, portalDataService }

  return { value } as ProviderProps<IProjectStatusContext>
}
