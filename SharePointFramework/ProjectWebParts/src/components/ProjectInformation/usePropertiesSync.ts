import { IProgressIndicatorProps } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { sleep } from 'pp365-shared-library/lib/util'
import { ProjectInformation } from '.'
import SPDataAdapter from '../../data'
import { IProjectInformationContext } from './context'
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
   * Skip progress indicator.
   */
  skipProgress?: boolean
}

/**
 * Hook for syncing project properties to the hub site.
 *
 * @param context Context for `ProjectInformation` component
 *
 * @returns Callback function for syncing project properties
 */
export function usePropertiesSync(context: IProjectInformationContext = null) {
  const syncList = async () => {
    const { created } = await SPDataAdapter.portal.syncList(
      context.props.webUrl,
      strings.ProjectPropertiesListName,
      context.state.data.templateParameters.ProjectContentTypeId ??
        '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
      { Title: context.props.webTitle }
    )
    return created
  }

  const syncPropertyItemToHub = async (
    progressFunc: (progress: IProgressIndicatorProps) => void
  ) => {
    await SPDataAdapter.syncPropertyItemToHub(
      context.state.data.fieldValues,
      { ...context.state.data.fieldValuesText, Title: context.props.webTitle },
      context.state.data.templateParameters,
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
  return async (params: IUsePropertiesSyncParams = {}): Promise<void> => {
    if (context.props.skipSyncToHub) return
    if (!params.skipProgress) {
      context.dispatch(
        SET_PROGRESS({ title: strings.SyncProjectPropertiesProgressLabel, progress: {} })
      )
    }
    const progressFunc = (progress: IProgressIndicatorProps) =>
      context.dispatch(
        SET_PROGRESS({ title: strings.SyncProjectPropertiesProgressLabel, progress })
      )
    try {
      if (!params.skipProgress) {
        progressFunc({
          label: strings.SyncProjectPropertiesListProgressDescription,
          description: `${strings.PleaseWaitText}...`
        })
      }
      let created = false
      if (params.syncList) created = await syncList()
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
      if (!params.skipProgress) {
        //context.addMessage(strings.SyncProjectPropertiesErrorText, MessageBarType.severeWarning)
      }
    } finally {
      if (!params.skipProgress) {
        context.dispatch(SET_PROGRESS())
      }
    }
  }
}
