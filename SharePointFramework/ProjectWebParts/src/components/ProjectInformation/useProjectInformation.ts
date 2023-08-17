import { ListLogger } from 'pp365-shared-library/lib/logging'
import strings from 'ProjectWebPartsStrings'
import { useMemo } from 'react'
import { ProjectInformation } from '.'
import SPDataAdapter from '../../data'
import { IProjectInformationContext } from './context'
import { useProjectInformationReducer } from './reducer'
import { IProjectInformationProps } from './types'
import { useProjectInformationDataFetch } from './useProjectInformationDataFetch'

/**
 * Component logic hook for `ProjectInformation`.
 *
 * If the `SPDataAdapter` is configured, it will initialize the `ListLogger` with the `LogListName`
 * from the `strings` resource file. It handles fetching the project data and setting the `state`
 * using hooks `useProjectInformationDataFetch` and `useProjectInformationReducer`.
 *
 * @param props Props
 *
 * @returns generated context value
 */
export const useProjectInformation = (props: IProjectInformationProps) => {
  const { state, dispatch } = useProjectInformationReducer(props.webPartContext)
  const context = useMemo<IProjectInformationContext>(() => ({ props, state, dispatch }), [state])

  if (SPDataAdapter.isConfigured) {
    ListLogger.init(
      SPDataAdapter.portal.web.lists.getByTitle(strings.LogListName),
      props.webUrl,
      ProjectInformation.displayName
    )
  }

  useProjectInformationDataFetch(context)

  return { context } as const
}
