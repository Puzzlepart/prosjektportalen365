import { stringIsNullOrEmpty } from '@pnp/common'
import { LogLevel } from '@pnp/logging'
import { format, IProgressIndicatorProps, MessageBarType } from 'office-ui-fabric-react'
import { parseUrlHash, sleep } from 'pp365-shared/lib/util'
import strings from 'ProjectWebPartsStrings'
import { useEffect, useState } from 'react'
import SPDataAdapter from '../../data'
import { ActionType } from './Actions/types'
import {
  IProjectInformationProps,
  IProjectInformationState,
  IProjectInformationUrlHash
} from './types'
import { useProjectInformationDataFetch } from './useProjectInformationDataFetch'

/**
 * Component logic hook for `ProjectInformation`
 *
 * @param props Props
 * @returns `state`, `setState`, `getCustomActions`, `onSyncProperties`
 */
export const useProjectInformation = (props: IProjectInformationProps) => {
  const [state, $setState] = useState<IProjectInformationState>({ loading: true })

  const setState = (newState: Partial<IProjectInformationState>) => {
    $setState((_state) => ({ ..._state, ...newState }))
  }

  SPDataAdapter.configure(props.webPartContext, {
    siteId: props.siteId,
    webUrl: props.webUrl,
    hubSiteUrl: props.hubSite.url,
    logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
  })

  /**
   * Get custom actions
   */
  const getCustomActions = (): ActionType[] => {
    const administerChildrenAction: ActionType = [
      strings.ChildProjectAdminLabel,
      () => {
        window.location.href = `${props.webPartContext.pageContext.web.serverRelativeUrl}/SitePages/${props.adminPageLink}`
      },
      'Org',
      false,
      !state.userHasEditPermission
    ]
    const transformToParentProject: ActionType = [
      strings.CreateParentProjectLabel,
      () => {
        setState({ displayParentCreationModal: true })
      },
      'Org',
      false,
      !state.userHasEditPermission
    ]
    const viewAllPropertiesAction: ActionType = [
      strings.ViewAllPropertiesLabel,
      () => {
        setState({ showProjectPropertiesPanel: true })
      },
      'EntryView',
      false,
      props.hideViewAllPropertiesButton
    ]
    const syncProjectPropertiesAction: ActionType = [
      strings.SyncProjectPropertiesText,
      () => {
        setState({ displaySyncProjectModal: true })
      },
      'Sync',
      false,
      !props.useIdeaProcessing || state.isProjectDataSynced || !state.userHasEditPermission
    ]
    if (state.isParentProject) {
      return [administerChildrenAction, viewAllPropertiesAction, syncProjectPropertiesAction]
    }
    return [transformToParentProject, viewAllPropertiesAction, syncProjectPropertiesAction]
  }

  /**
   * Add message
   * 
   * @param text Message text 
   * @param messageBarType Message type
   * @param duration Duration in seconds
   */
  const addMessage = (
    text: string,
    messageBarType: MessageBarType,
    duration: number = 5
  ): Promise<void> => {
    return new Promise((resolve) => {
      setState({
        ...state,
        message: {
          text: format(text, duration.toString()),
          messageBarType,
          onDismiss: () => setState({ ...state, message: null })
        }
      })
      window.setTimeout(() => {
        setState({ ...state, message: null })
        resolve()
      }, duration * 1000)
    })
  }

  /**
   * On sync properties
   * 
   * @param force Force start sync
   */
  const onSyncProperties = async (force: boolean = false): Promise<void> => {
    if (!stringIsNullOrEmpty(state.data.propertiesListId)) {
      const lastUpdated = await SPDataAdapter.project.getPropertiesLastUpdated(state.data)
      if (lastUpdated > 60 && !force) return
    }
    if (props.skipSyncToHub) return
    setState({ progress: { title: strings.SyncProjectPropertiesProgressLabel, progress: {} } })
    const progressFunc = (progress: IProgressIndicatorProps) =>
      setState({ progress: { title: strings.SyncProjectPropertiesProgressLabel, progress } })
    try {
      progressFunc({
        label: strings.SyncProjectPropertiesListProgressDescription,
        description: `${strings.PleaseWaitText}...`
      })
      const { created } = await SPDataAdapter.portal.syncList(
        props.webUrl,
        strings.ProjectPropertiesListName,
        state.data.templateParameters.ProjectContentTypeId ||
        '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
        { Title: props.webTitle }
      )
      if (!created) {
        await SPDataAdapter.syncPropertyItemToHub(
          state.data.fieldValues,
          { ...state.data.fieldValuesText, Title: props.webTitle },
          state.data.templateParameters,
          progressFunc
        )
      }
      SPDataAdapter.clearCache()
      await sleep(5)
      document.location.href =
        sessionStorage.DEBUG || DEBUG ? document.location.href.split('#')[0] : props.webUrl
    } catch (error) {
      addMessage(strings.SyncProjectPropertiesErrorText, MessageBarType.severeWarning)
    } finally {
      setState({ progress: null })
    }
  }

  useProjectInformationDataFetch(props, (data) => setState({ ...data, loading: false }))

  useEffect(() => {
    if (state?.data?.fieldValues) {
      const urlHash = parseUrlHash<IProjectInformationUrlHash>(true)
      if (urlHash.syncproperties === '1') onSyncProperties(urlHash.force === '1')
    }
  }, [state?.data?.fieldValues])

  return {
    state,
    setState,
    getCustomActions,
    onSyncProperties
  }
}
