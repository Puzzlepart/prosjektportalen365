import { useModel } from './useModel'
import { useFields } from './useFields'
import { useFieldElements } from './useFieldElements'
import { useSubmit } from './useSubmit'

/**
 * Hook for `EditPropertiesPanel` component
 *
 * @returns `fields` and `getFieldElement` properties
 */
export function useEditPropertiesPanel() {
  const fields = useFields()
  const model = useModel()
  const getFieldElement = useFieldElements(model)
  const { onSave } = useSubmit(model)

  return { fields, getFieldElement, model, onSave } as const
}
