import { useEditPropertiesPanelModel } from './useEditPropertiesPanelModel'
import { useEditPropertiesPanelFields } from './useEditPropertiesPanelFields'
import { useEditPropertiesPanelFieldElements } from './useEditPropertiesPanelFieldElements'

/**
 * Hook for `EditPropertiesPanel` component
 *
 * @returns `fields` and `getFieldElement` properties
 */
export function useEditPropertiesPanel() {
  const fields = useEditPropertiesPanelFields()
  const model = useEditPropertiesPanelModel()
  const getFieldElement = useEditPropertiesPanelFieldElements(model)

  return { fields, getFieldElement } as const
}
