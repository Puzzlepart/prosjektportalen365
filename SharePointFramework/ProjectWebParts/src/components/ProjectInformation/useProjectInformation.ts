import { useId } from '@fluentui/react-components'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { useMemo } from 'react'
import { ProjectInformation } from '.'
import SPDataAdapter from '../../data'
import { IProjectInformationContext } from './context'
import { useProjectInformationDataFetch } from './data'
import { useProjectInformationReducer } from './reducer'
import { IProjectInformationProps } from './types'
import resource from 'SharedResources'

/** Initializes project information state, logging, data loading and its shared context. */
export const useProjectInformation = (props: IProjectInformationProps) => {
  const { state, dispatch } = useProjectInformationReducer(props.spfxContext)
  const context = useMemo<IProjectInformationContext>(
    () => ({ props, state, dispatch }),
    [props, state]
  )

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
