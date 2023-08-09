import { useEditPropertiesPanelModel } from './useEditPropertiesPanelModel'
import SPDataAdapter from '../../../data'
import { useContext } from 'react'
import { ProjectInformationContext } from '../context'

export function useEditPropertiesPanelSubmit(
  model: ReturnType<typeof useEditPropertiesPanelModel>
) {
  const context = useContext(ProjectInformationContext)
  const onSave = async () => {
    await SPDataAdapter.project.updateProjectProperties(model.properties)
    context.setState({ displayEditPropertiesPanel: false })
  }

  return { onSave } as const
}
