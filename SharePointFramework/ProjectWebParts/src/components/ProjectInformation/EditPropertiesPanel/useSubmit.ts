import SPDataAdapter from '../../../data'
import { useProjectInformationContext } from '../context'
import { useModel } from './useModel'

export function useSubmit(model: ReturnType<typeof useModel>) {
  const context = useProjectInformationContext()
  const onSave = async () => {
    await SPDataAdapter.project.updateProjectProperties(model.properties)
    context.setState({ displayEditPropertiesPanel: false, propertiesLastUpdated: new Date() })
  }

  return { onSave } as const
}
