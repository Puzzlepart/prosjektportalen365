import { IProgressIndicatorProps, MessageBarType } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'ProjectWebPartsStrings'
import SPDataAdapter from 'data'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { sleep } from 'pp365-shared-library/lib/util'
import { ProjectInformation } from '.'
import { IProjectInformationContext } from './context'

/**
 * Hook for syncing project properties to the hub site.
 *
 * @param context Context for `ProjectInformation` component
 *
 * @returns Callback function for syncing project properties
 */
export function usePropertiesSync(context: IProjectInformationContext = null) {
  return async (force: boolean = false): Promise<void> => {
    if (!stringIsNullOrEmpty(context.state.data.propertiesListId)) {
      const lastUpdated = await SPDataAdapter.project.getPropertiesLastUpdated(context.state.data)
      if (lastUpdated > 60 && !force) return
    }
    if (context.props.skipSyncToHub) return
    context.setState({
      progress: { title: strings.SyncProjectPropertiesProgressLabel, progress: {} }
    })
    const progressFunc = (progress: IProgressIndicatorProps) =>
      context.setState({
        progress: { title: strings.SyncProjectPropertiesProgressLabel, progress }
      })
    try {
      progressFunc({
        label: strings.SyncProjectPropertiesListProgressDescription,
        description: `${strings.PleaseWaitText}...`
      })
      const { created } = await SPDataAdapter.portal.syncList(
        context.props.webUrl,
        strings.ProjectPropertiesListName,
        context.state.data.templateParameters.ProjectContentTypeId ??
          '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
        { Title: context.props.webTitle }
      )
      if (!created) {
        await SPDataAdapter.syncPropertyItemToHub(
          context.state.data.fieldValues,
          { ...context.state.data.fieldValuesText, Title: context.props.webTitle },
          context.state.data.templateParameters,
          progressFunc
        )
      }
      SPDataAdapter.clearCache()
      await sleep(5)
      document.location.href =
        sessionStorage.DEBUG || DEBUG ? document.location.href.split('#')[0] : context.props.webUrl
    } catch (error) {
      ListLogger.log({
        message: error.message,
        level: 'Error',
        functionName: 'onSyncProperties',
        component: ProjectInformation.displayName
      })
      context.addMessage(strings.SyncProjectPropertiesErrorText, MessageBarType.severeWarning)
    } finally {
      context.setState({ progress: null })
    }
  }
}
