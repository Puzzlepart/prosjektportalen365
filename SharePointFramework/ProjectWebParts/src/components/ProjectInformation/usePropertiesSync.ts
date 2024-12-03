import { IProgressIndicatorProps } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { sleep } from 'pp365-shared-library/lib/util'
import SPDataAdapter from '../../data'
import { IProjectInformationContext } from './context'
import { IProjectInformationData, ProjectInformation } from './index'
import { SET_PROGRESS } from './reducer'

interface IUsePropertiesSyncParams {
  /**
   * Sync fields to the project properties list.
   */
  syncList?: boolean

  /**
   * Sync project properties to the hub site.
   */
  syncPropertyItemToHub?: boolean

  /**
   * Reload page after sync.
   */
  reload?: boolean

  /**
   * Progress callback function.
   *
   * @param progress Progress text.
   */
  onProgress?: (progress: string) => void

  /**
   * Data to sync.
   */
  data?: IProjectInformationData
}
/**
 * Sync fields to the project properties list.
 *
 * @param context Context for `ProjectInformation` component
 *
 * @returns `true` if the project properties list is created, otherwise `false`.
 */
const syncList = async (context: IProjectInformationContext) => {
  return await SPDataAdapter.portalDataService.syncList({
    url: context.props.webAbsoluteUrl,
    listName: strings.ProjectPropertiesListName,
    contentTypeId:
      context.state.data.templateParameters.ProjectContentTypeId ??
      '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
    properties: { Title: context.props.webTitle }
  })
}

/**
 * Hook for syncing project properties to the hub site.
 *
 * @param context Context for `ProjectInformation` component
 *
 * @returns Returns a function for syncing project properties to the hub site. The function
 * also accepts parameters for controlling e.g. the sync process, such as synchronizing fields
 * to the project properties list, and reloading the page after sync.
 */
export function usePropertiesSync(context: IProjectInformationContext = null) {
  /**
   * Sync properties to the hub site.
   *
   * @param data Project properties data.
   * @param progressFunc Progress callback function.
   */
  const syncPropertyItemToHub = async (
    data = context.state.data,
    progressFunc: (progress: IProgressIndicatorProps) => void = () => null
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
   * Callback function for syncing project properties to the hub site, and fields
   * from hub site to the project properties list.
   *
   * The following parameters can be used to control the sync process:
   * - `syncList`: Sync fields to the project properties list.
   * - `syncPropertyItemToHub`: Sync project properties to the hub site.
   * - `reload`: Reload page after sync.
   * - `skipProgress`: Skip progress indicator.
   */
  const onSyncProperties = async (params: IUsePropertiesSyncParams = {}): Promise<void> => {
    if (context.props.skipSyncToHub) return
    params.onProgress(strings.SyncProjectPropertiesProgressLabel)
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
      ListLogger.log({
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
