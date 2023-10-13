import { ItemFieldValues } from 'pp365-shared-library'
import { useProjectStatusContext } from '../context'
import { CLOSE_PANEL } from '../reducer'
import { useEditStatusPanelSubmit } from './useEditStatusPanelSubmit'

/**
 * Component logic hook for `EditStatusPanel` that provides the
 * `isOpen`, `onDismiss`, `fields`, `fieldValues` and `submit` properties.
 */
export function useEditStatusPanel() {
  const context = useProjectStatusContext()
  const submit = useEditStatusPanelSubmit()
  const isOpen = context.state.activePanel === 'EditStatusPanel'
  const onDismiss = () => context.dispatch(CLOSE_PANEL())
  const fieldValues = context.state.selectedReport?.fieldValues ?? new ItemFieldValues()
  const fields = (context.state.data?.reportFields ?? []).map((field) =>
    field.setValue(fieldValues)
  )
  return { isOpen, onDismiss, fieldValues, fields, submit }
}
