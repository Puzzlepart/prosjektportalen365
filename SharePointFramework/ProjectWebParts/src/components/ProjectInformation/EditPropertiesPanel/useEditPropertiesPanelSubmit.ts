import SPDataAdapter from '../../../data'
import { useProjectInformationContext } from '../context'
import { useEditPropertiesPanelModel } from './useEditPropertiesPanelModel'

export function useEditPropertiesPanelSubmit(
  model: ReturnType<typeof useEditPropertiesPanelModel>
) {
  const context = useProjectInformationContext()
  const onSave = async () => {
    await SPDataAdapter.project.updateProjectProperties(model.properties)
    context.setState({ displayEditPropertiesPanel: false, propertiesLastUpdated: new Date() })
  }

  return { onSave } as const
}