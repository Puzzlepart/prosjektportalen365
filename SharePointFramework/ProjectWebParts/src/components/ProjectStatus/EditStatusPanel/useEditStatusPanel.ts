import { ItemFieldValues } from 'pp365-shared-library'
import { useProjectStatusContext } from '../context'
import { CLOSE_PANEL } from '../reducer'
import { useEditStatusPanelSubmit } from './useEditStatusPanelSubmit'
import strings from 'ProjectWebPartsStrings'

/**
 * Component logic hook for `EditStatusPanel` that provides the
 * `isOpen`, `onDismiss`, `fields`, `fieldValues` and `submit` properties.
 * Hook `useEditStatusPanelSubmit` is used to provide the `submit` property.
 */
export function useEditStatusPanel() {
  const context = useProjectStatusContext()
  const { selectedReport, activePanel } = context.state
  const isOpen = activePanel?.name === 'EditStatusPanel'
  const onDismiss = () => context.dispatch(CLOSE_PANEL())
  const fieldValues = selectedReport?.fieldValues ?? new ItemFieldValues()
  const fields = (context.state.data?.reportFields ?? []).map((field) =>
    field.setValue(fieldValues)
  )
  const submit = useEditStatusPanelSubmit()
  return {
    headerText: activePanel?.headerText ?? strings.EditStatusPanelText,
    isOpen,
    onDismiss,
    fieldValues,
    fields,
    submit
  }
}
