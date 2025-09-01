import { useId } from '@fluentui/react-components'
import strings from 'ProjectWebPartsStrings'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { useMemo } from 'react'
import { ProjectInformation } from '.'
import SPDataAdapter from '../../data'
import { IProjectInformationContext } from './context'
import { useProjectInformationDataFetch } from './data'
import { useProjectInformationReducer } from './reducer'
import { IProjectInformationProps } from './types'
import resource from 'SharedResources'

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
  const { state, dispatch } = useProjectInformationReducer(props.spfxContext)
  const context = useMemo<IProjectInformationContext>(() => ({ props, state, dispatch }), [state])

  if (SPDataAdapter.isConfigured) {
    ListLogger.init(
      SPDataAdapter.portalDataService.web.lists.getByTitle(resource.Lists_Log_Title),
      props.webAbsoluteUrl,
      ProjectInformation.displayName
    )
  }

  useProjectInformationDataFetch(context)
  const fluentProviderId = useId('fp-project-information')

  return { fluentProviderId, context }
}
