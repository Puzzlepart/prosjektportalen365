import SPDataAdapter from '../../../data'
import { useProjectInformationContext } from '../context'
import { CLOSE_PANEL, PROPERTIES_UPDATED } from '../reducer'
import { useModel } from './useModel'

export function useSubmit(model: ReturnType<typeof useModel>) {
  const context = useProjectInformationContext()
  const onSave = async () => {
    await SPDataAdapter.project.updateProjectProperties(model.properties)
    context.dispatch(CLOSE_PANEL())
    context.dispatch(PROPERTIES_UPDATED())
  }

  return { onSave } as const
}
