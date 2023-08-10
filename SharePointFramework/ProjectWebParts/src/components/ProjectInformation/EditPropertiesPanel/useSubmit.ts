import SPDataAdapter from '../../../data'
import { useProjectInformationContext } from '../context'
import { CLOSE_PANEL, PROPERTIES_UPDATED } from '../reducer'
import { usePropertiesSync } from '../usePropertiesSync'
import { useModel } from './useModel'

/**
 * Hook for submitting the properties to the project and syncing to the hub. Returns
 * a function that can be called to save the properties.
 *
 * @param model Model returned from `useModel`
 */
export function useSubmit(model: ReturnType<typeof useModel>) {
  const context = useProjectInformationContext()
  const { syncPropertyItemToHub } = usePropertiesSync(context)

  /**
   * Save the properties to the project, and sync to the hub, then
   * clear the local storage and close the panel.
   */
  const onSave = async () => {
    await SPDataAdapter.project.updateProjectProperties(model.properties)
    await syncPropertyItemToHub(() => null, model.properties)
    localStorage.clear()
    context.dispatch(CLOSE_PANEL())
    context.dispatch(PROPERTIES_UPDATED({ refetch: true }))
  }

  return onSave
}
