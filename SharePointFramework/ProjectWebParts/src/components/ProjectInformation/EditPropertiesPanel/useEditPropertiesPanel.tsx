import { useEditPropertiesPanelModel } from './useEditPropertiesPanelModel'
import { useEditPropertiesPanelFields } from './useEditPropertiesPanelFields'
import { useEditPropertiesPanelFieldElements } from './useEditPropertiesPanelFieldElements'
import { useEditPropertiesPanelSubmit } from './useEditPropertiesPanelSubmit'

/**
 * Hook for `EditPropertiesPanel` component
 *
 * @returns `fields` and `getFieldElement` properties
 */
export function useEditPropertiesPanel() {
  const fields = useEditPropertiesPanelFields()
  const model = useEditPropertiesPanelModel()
  const getFieldElement = useEditPropertiesPanelFieldElements(model)
  const { onSave } = useEditPropertiesPanelSubmit(model)

  return { fields, getFieldElement, model, onSave } as const
}
