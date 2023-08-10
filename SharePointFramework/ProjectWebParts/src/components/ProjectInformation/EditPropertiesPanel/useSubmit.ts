import SPDataAdapter from '../../../data'
import { useProjectInformationContext } from '../context'
import { CLOSE_PANEL, PROPERTIES_UPDATED } from '../reducer'
import { usePropertiesSync } from '../usePropertiesSync'
import { useModel } from './useModel'

export function useSubmit(model: ReturnType<typeof useModel>) {
  const context = useProjectInformationContext()
  const { syncPropertyItemToHub } = usePropertiesSync(context)
  const onSave = async () => {
    await SPDataAdapter.project.updateProjectProperties(model.properties)
    await syncPropertyItemToHub(() => {
      // TODO: Progress function
    }, model.properties)
    context.dispatch(CLOSE_PANEL())
    context.dispatch(PROPERTIES_UPDATED({ refetch: true }))
  }

  return { onSave } as const
}
