import { SelectTabData, useId } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import * as strings from 'ProjectExtensionsStrings'
import { useEffect, useReducer, useState } from 'react'
import createReducer, { INIT, initialState } from './reducer'
import { IProjectSetupDialogProps, ProjectSetupConfigTab } from './types'
import _ from 'underscore'

/**
 * Component logic for the `ProjectSetupDialog` component: the setup's state, the configuration
 * tab shown and its count, and whether the setup can be submitted.
 *
 * @param props Props for the `ProjectSetupDialog` component.
 */
export function useProjectSetupDialog(props: IProjectSetupDialogProps) {
  const [state, dispatch] = useReducer(createReducer(props.data), initialState)

  useEffect(() => {
    dispatch(INIT())
  }, [])

  /**
   * On submit the selected user configuration.
   */
  const onSubmit = () => {
    props.onSubmit(state)
  }

  /**
   * Checks if the configuration should be disabled. Configuration
   * tab is disabled if there is no configuration available or if there is
   * no selected template.
   *
   * @param type Type of configuration to check.
   *
   * @returns `true` if the configuration is disabled.
   */
  const isConfigDisabled = (type: ProjectSetupConfigTab) => {
    if (!state.selectedTemplate) return true
    const items = (
      state.selectedTemplate.isCloudTemplate
        ? state.resolvedCloudTemplate?.[type]
        : props.data[type]
    ) as Array<{ hidden: boolean }>
    if (_.isEmpty(items)) return true
    return items.every((item) => item.hidden)
  }

  // Hidden selections (e.g. a locked, template-bound extension) are applied but never shown, so
  // they are not counted in the visible badges.
  const extensionsCount = state.selectedExtensions?.filter((e) => !e.hidden).length ?? 0
  const contentConfigCount = state.selectedContentConfig?.filter((c) => !c.hidden).length ?? 0
  const hasExtensions = !isConfigDisabled('extensions')
  const hasContentConfig = !isConfigDisabled('contentConfig')

  const [activeTab, setActiveTab] = useState<ProjectSetupConfigTab>(
    hasExtensions ? 'extensions' : 'contentConfig'
  )
  const extensionsTabId = useId('extensions-tab')
  const contentConfigTabId = useId('content-config-tab')
  const tabIds: Record<ProjectSetupConfigTab, string> = {
    extensions: extensionsTabId,
    contentConfig: contentConfigTabId
  }

  useEffect(() => {
    if (hasExtensions) {
      setActiveTab('extensions')
    } else if (hasContentConfig) {
      setActiveTab('contentConfig')
    }
  }, [hasExtensions, hasContentConfig])

  /**
   * The name of a tab with a count, which says what the count is: «Prosjekttillegg, 2 valgt»
   * (WCAG 1.1.1). A tab without one is named by its text.
   *
   * @param header The tab's text
   * @param count How many are chosen
   */
  const tabLabel = (header: string, count: number) =>
    count > 0 ? format(strings.ConfigTabSelectedLabel, header, count) : undefined

  const onTabSelect = (_event: unknown, data: SelectTabData) =>
    setActiveTab(data.value as ProjectSetupConfigTab)

  const isSubmitDisabled =
    !state.selectedTemplate ||
    state.isResolvingCloudTemplate ||
    // A cloud template can only be submitted once its .pppkg has resolved.
    (state.selectedTemplate.isCloudTemplate && !state.resolvedCloudTemplate)

  return {
    state,
    dispatch,
    onSubmit,
    isConfigDisabled,
    extensionsCount,
    contentConfigCount,
    hasExtensions,
    hasContentConfig,
    activeTab,
    onTabSelect,
    tabIds,
    tabLabel,
    isSubmitDisabled
  }
}
