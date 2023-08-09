import { useEditPropertiesPanelModel } from './useEditPropertiesPanelModel'
import SPDataAdapter from '../../../data'

export function useEditPropertiesPanelSubmit(model: ReturnType<typeof useEditPropertiesPanelModel>) {

  const onSave = async () => {
    await SPDataAdapter.project.updateProperties(model.properties)
    alert('Saved')
  }

  return { onSave } as const
}
