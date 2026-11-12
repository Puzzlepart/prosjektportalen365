import { SelectTabData, useId } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import * as strings from 'ProjectExtensionsStrings'
import { useEffect, useReducer, useState } from 'react'
import createReducer, { INIT, initialState } from './reducer'
import { IProjectSetupDialogProps, ProjectSetupConfigTab } from './types'
import _ from 'underscore'

/** Coordinates setup selections, configuration tabs and submission readiness. */
export function useProjectSetupDialog(props: IProjectSetupDialogProps) {
  const [state, dispatch] = useReducer(createReducer(props.data), initialState)

  useEffect(() => {
    dispatch(INIT())
  }, [])

  const onSubmit = () => {
    props.onSubmit(state)
  }

  /**
   * Disables configuration when no template or no visible configuration items are available.
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
   * Names nonzero tab counts as selections rather than unexplained numbers.
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
