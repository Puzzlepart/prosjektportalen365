import { format, IProgressIndicatorProps, MessageBarType } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import { ListLogger } from 'pp365-shared/lib/logging'
import { parseUrlHash, sleep } from 'pp365-shared/lib/util'
import strings from 'ProjectWebPartsStrings'
import { useEffect } from 'react'
import { ProjectInformation } from '.'
import SPDataAdapter from '../../data'
import { IProjectInformationProps, IProjectInformationUrlHash } from './types'
import { useProjectInformationDataFetch } from './useProjectInformationDataFetch'
import { useProjectInformationState } from './useProjectInformationState'

/**
 * Component logic hook for `ProjectInformation`. If the SPDataAdapter is configured, it will
 * initialize the `ListLogger` with the `LogListName` from the `strings` resource file. It handles
 * fetching the project data and setting the state. It also provides callback functions `addMessage`
 * and `onSyncProperties`, aswell as handling hash changes.
 *
 * @param props Props
 *
 * @returns `state`, `setState`, `onSyncProperties`
 */
export const useProjectInformation = (props: IProjectInformationProps) => {
  const { state, setState } = useProjectInformationState()

  if (SPDataAdapter.isConfigured) {
    ListLogger.init(
      SPDataAdapter.portal.web.lists.getByTitle(strings.LogListName),
      props.webUrl,
      ProjectInformation.displayName
    )
  }

  /**
   * Add message
   *
   * @param text Message text
   * @param type Message bar type
   * @param durationSec Duration in seconds
   */
  const addMessage = (text: string, type: MessageBarType, durationSec: number = 5) => {
    return new Promise<void>((resolve) => {
      setState({
        message: {
          text: format(text, durationSec.toString()),
          type,
          onDismiss: () => setState({ message: null })
        }
      })
      window.setTimeout(() => {
        setState({ message: null })
        resolve()
      }, durationSec * 1000)
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
        state.data.templateParameters.ProjectContentTypeId ??
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
      ListLogger.log({
        message: error.message,
        level: 'Error',
        functionName: 'onSyncProperties',
        component: ProjectInformation.displayName
      })
      addMessage(strings.SyncProjectPropertiesErrorText, MessageBarType.severeWarning)
    } finally {
      setState({ progress: null })
    }
  }

  useProjectInformationDataFetch(props, setState)

  useEffect(() => {
    if (state?.data?.fieldValues) {
      const urlHash = parseUrlHash<IProjectInformationUrlHash>(true)
      if (urlHash.syncproperties === '1') onSyncProperties(urlHash.force === '1')
    }
  }, [state?.data?.fieldValues])

  return {
    state,
    setState,
    addMessage,
    onSyncProperties
  } as const
}
