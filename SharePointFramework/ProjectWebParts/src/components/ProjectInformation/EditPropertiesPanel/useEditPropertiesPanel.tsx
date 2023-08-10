import { useProjectInformationContext } from '../context'
import { usePropertiesSync } from '../usePropertiesSync'
import { useFieldElements } from './useFieldElements'
import { useFields } from './useFields'
import { useModel } from './useModel'
import { useSubmit } from './useSubmit'

/**
 * Hook for `EditPropertiesPanel` component. Generates fields and field elements
 * using hooks and provides them to the component. Also handles submitting the
 * form and syncing the property list fields.
 *
 * @returns The following properties:
 * - `fields` - the fields to render
 * - `getFieldElement` - a function that returns the field element for a given field
 * - `model` - the model for the form
 * - `onSave` - the submit handler for the form
 */
export function useEditPropertiesPanel() {
  const context = useProjectInformationContext()
  const fields = useFields()
  const model = useModel()
  const getFieldElement = useFieldElements(model)
  const onSave = useSubmit(model)
  const { useSyncList } = usePropertiesSync(context)
  useSyncList(context.state.activePanel === 'EditPropertiesPanel')

  return { fields, getFieldElement, model, onSave } as const
}
