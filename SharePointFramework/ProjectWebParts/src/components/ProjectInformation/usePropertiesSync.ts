import { IProgressIndicatorProps } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { sleep } from 'pp365-shared-library/lib/util'
import SPDataAdapter from '../../data'
import { IProjectInformationContext } from './context'
import { ProjectInformation } from './index'
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
}

/**
 * Hook for syncing project properties to the hub site.
 *
 * @param context Context for `ProjectInformation` component
 *
 * @returns Callback function for syncing project properties to the hub site, and fields
 * from hub site to the project properties list.
 */
export function usePropertiesSync(context: IProjectInformationContext = null) {
  /**
   * Sync fields to the project properties list.
   *
   * @returns `true` if the project properties list is created, otherwise `false`.
   */
  const syncList = async () => {
    return await SPDataAdapter.portal.syncList({
      url: context.props.webUrl,
      listName: strings.ProjectPropertiesListName,
      contentTypeId:
        context.state.data.templateParameters.ProjectContentTypeId ??
        '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
      properties: { Title: context.props.webTitle }
    })
  }

  /**
   * Sync properties to the hub site.
   *
   * @param progressFunc Progress callback function.
   * @param properties Properties to sync to the hub site (default: `context.state.data.fieldValuesText`)
   */
  const syncPropertyItemToHub = async (
    progressFunc: (progress: IProgressIndicatorProps) => void,
    properties = context.state.data.fieldValuesText
  ) => {
    const { fieldValues, fieldValuesText, templateParameters } = context.state.data
    await SPDataAdapter.syncPropertyItemToHub(
      { ...fieldValuesText, ...properties, Title: context.props.webTitle },
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
    context.dispatch(
      SET_PROGRESS({ title: strings.SyncProjectPropertiesProgressLabel, progress: {} })
    )
    const progressFunc = (progress: IProgressIndicatorProps) =>
      context.dispatch(
        SET_PROGRESS({ title: strings.SyncProjectPropertiesProgressLabel, progress })
      )
    try {
      progressFunc({
        label: strings.SyncProjectPropertiesListProgressDescription,
        description: `${strings.PleaseWaitText}...`
      })
      let created = false
      if (params.syncList) created = (await syncList()).list.created
      if (!created && params.syncPropertyItemToHub) await syncPropertyItemToHub(progressFunc)
      SPDataAdapter.clearCache()
      await sleep(5)
      if (params.reload) window.location.reload()
    } catch (error) {
      ListLogger.log({
        message: error.message,
        level: 'Error',
        functionName: 'onSyncProperties',
        component: ProjectInformation.displayName
      })
      //context.addMessage(strings.SyncProjectPropertiesErrorText, MessageBarType.severeWarning)
    } finally {
      context.dispatch(SET_PROGRESS(null))
    }
  }

  return {
    syncList,
    syncPropertyItemToHub,
    onSyncProperties
  }
}
