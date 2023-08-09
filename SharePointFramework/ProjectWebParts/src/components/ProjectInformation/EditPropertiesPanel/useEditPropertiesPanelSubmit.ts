import { useEditPropertiesPanelModel } from './useEditPropertiesPanelModel'
import SPDataAdapter from '../../../data'

export function useEditPropertiesPanelSubmit(model: ReturnType<typeof useEditPropertiesPanelModel>) {

  const onSave = async () => {
    alert('Saved')
    // eslint-disable-next-line no-console
    console.log(model.values)
    await SPDataAdapter.project.updateProperties(model.values)
  }

  return { onSave } as const
}
