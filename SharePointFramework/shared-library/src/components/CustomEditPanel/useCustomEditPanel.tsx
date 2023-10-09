import { ICustomEditPanelProps } from './types'
import { useEditableFields } from './useEditableFields'
import { useFieldElements } from './useFieldElements'
import { useModel } from './useModel'

/**
 * Hook for `CustomEditPanel` component. Generates fields and field elements
 * using hooks and provides them to the component. Also handles submitting the
 * form and syncing the property list fields.
 *
 * @returns The following properties:
 * - `fields` - the fields to render
 * - `getFieldElement` - a function that returns the field element for a given field
 * - `model` - the model for the form
 */
export function useCustomEditPanel(props: ICustomEditPanelProps) {
  const fields = useEditableFields(props)
  const model = useModel(props)
  const getFieldElement = useFieldElements(model, props)

  return { fields, getFieldElement, model }
}
