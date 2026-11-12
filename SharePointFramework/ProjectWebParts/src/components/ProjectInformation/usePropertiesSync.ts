import strings from 'ProjectWebPartsStrings'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { sleep } from 'pp365-shared-library/lib/util'
import SPDataAdapter from '../../data'
import { IProjectInformationContext } from './context'
import { IProjectInformationData, ProjectInformation } from './index'
import { SET_HUB_SYNC_WARNING, SET_PROGRESS } from './reducer'
import resource from 'SharedResources'
import { IProgressProps, format } from 'pp365-shared-library'
import { getHubSyncErrorReason } from '../../data/hubSyncError'

interface IUsePropertiesSyncParams {
  syncList?: boolean

  syncPropertyItemToHub?: boolean

  reload?: boolean

  onProgress?: (progress: string) => void

  data?: IProjectInformationData
}
/**
 * Synchronizes the project's properties list with its configured content type.
 *
 * @returns The list synchronization result, including whether the list was created
 */
const syncList = async (context: IProjectInformationContext) => {
  return await SPDataAdapter.portalDataService.syncList({
    url: context.props.webAbsoluteUrl,
    listName: resource.Lists_ProjectProperties_Title,
    contentTypeId:
      context.state.data.templateParameters.ProjectContentTypeId ??
      '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
    properties: { Title: context.props.webTitle }
  })
}

/**
 * Coordinates properties-list synchronization and hub updates, preserving a warning on failure.
 * A sync the hub does not take is shown as a warning and counted for usage statistics, by its
 * error code.
 */
export function usePropertiesSync(context: IProjectInformationContext = null) {
  const telemetry = useTelemetry()

  /**
   * Synchronizes the supplied or currently loaded project properties to the hub.
   */
  const syncPropertyItemToHub = async (
    data = context.state.data,
    progressFunc: (progress: IProgressProps) => void = () => null
  ) => {
    const { fieldValues, templateParameters } = data
    await SPDataAdapter.syncPropertyItemToHub(
      context.props.webTitle,
      fieldValues,
      templateParameters,
      progressFunc
    )
  }

  /**
   * Runs the requested sync steps, reports progress and optionally reloads after success.
   */
  const onSyncProperties = async (params: IUsePropertiesSyncParams = {}): Promise<void> => {
    if (context.props.skipSyncToHub) return
    params.onProgress(strings.SyncProjectPropertiesProgressLabel)
    context.dispatch(SET_HUB_SYNC_WARNING(null))
    try {
      params.onProgress(strings.SyncProjectPropertiesListProgressDescription)
      let created = false
      if (params.syncList) {
        const list = await syncList(context)
        created = list.created
      }
      if (!created && params.syncPropertyItemToHub)
        await syncPropertyItemToHub(params.data, (progress) =>
          params.onProgress(progress.label as string)
        )
      SPDataAdapter.clearCache()
      if (params.reload) {
        await sleep(3)
        window.location.reload()
      }
    } catch (error) {
      telemetry.trackError(error)
      context.dispatch(
        SET_HUB_SYNC_WARNING(
          format(strings.ProjectPropertiesNotSyncedToHubText, getHubSyncErrorReason(error))
        )
      )
      void ListLogger.log({
        message: error.message,
        level: 'Error',
        functionName: 'onSyncProperties',
        component: ProjectInformation.displayName
      })
    } finally {
      context.dispatch(SET_PROGRESS(null))
    }
  }

  return onSyncProperties
}
