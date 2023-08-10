import { useProjectInformationContext } from '../context'
import { useSyncList } from '../usePropertiesSync'
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
 * - `submit` - the submit functions and its state
 */
export function useEditPropertiesPanel() {
  const context = useProjectInformationContext()
  const fields = useFields()
  const model = useModel()
  const getFieldElement = useFieldElements(model)
  const submit = useSubmit(model)

  useSyncList({
    condition: context.state.activePanel === 'EditPropertiesPanel',
    refetch: true
  })

  return { fields, getFieldElement, model, submit } as const
}
