import { format } from 'pp365-shared-library'
import * as strings from 'ProjectExtensionsStrings'
import { useEffect, useReducer } from 'react'
import createReducer, { INIT, initialState } from './reducer'
import { IProjectSetupDialogProps } from './types'

/** Coordinates setup selections, their summary and submission readiness. */
export function useProjectSetupDialog(props: IProjectSetupDialogProps) {
  const [state, dispatch] = useReducer(createReducer(props.data), initialState)

  useEffect(() => {
    dispatch(INIT())
  }, [])

  const onSubmit = () => {
    props.onSubmit(state)
  }

  // Hidden selections (e.g. a locked, template-bound extension) are applied but never shown, so
  // they are not counted.
  const extensionsCount = state.selectedExtensions?.filter((e) => !e.hidden).length ?? 0
  const contentConfigCount = state.selectedContentConfig?.filter((c) => !c.hidden).length ?? 0

  // What the button will set up, beside it: the lists above may have scrolled out of view.
  const summaryText = state.selectedTemplate
    ? format(
        strings.SetupSummaryLabel,
        state.selectedTemplate.text,
        extensionsCount,
        contentConfigCount
      )
    : undefined

  const isSubmitDisabled =
    !state.selectedTemplate ||
    state.isResolvingCloudTemplate ||
    // A cloud template can only be submitted once its .pppkg has resolved.
    (state.selectedTemplate.isCloudTemplate && !state.resolvedCloudTemplate)

  return {
    state,
    dispatch,
    onSubmit,
    summaryText,
    isSubmitDisabled
  }
}
