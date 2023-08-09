import { format, MessageBarType } from '@fluentui/react'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { parseUrlHash } from 'pp365-shared-library/lib/util'
import strings from 'ProjectWebPartsStrings'
import { useEffect, useMemo } from 'react'
import { ProjectInformation } from '.'
import SPDataAdapter from '../../data'
import { IProjectInformationProps, IProjectInformationUrlHash } from './types'
import { useProjectInformationDataFetch } from './useProjectInformationDataFetch'
import { useProjectInformationState } from './useProjectInformationState'
import { usePropertiesSync } from './usePropertiesSync'
import { IProjectInformationContext } from './context'

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

  const context = useMemo<IProjectInformationContext>(
    () => ({ props, state, setState, addMessage }),
    [state]
  )
  const onSyncProperties = usePropertiesSync(context)

  if (SPDataAdapter.isConfigured) {
    ListLogger.init(
      SPDataAdapter.portal.web.lists.getByTitle(strings.LogListName),
      props.webUrl,
      ProjectInformation.displayName
    )
  }

  useProjectInformationDataFetch(context)

  useEffect(() => {
    if (state?.data?.fieldValues) {
      const urlHash = parseUrlHash<IProjectInformationUrlHash>(true)
      if (urlHash.syncproperties === '1') onSyncProperties(urlHash.force === '1')
    }
  }, [state?.data?.fieldValues])

  return { context } as const
}
