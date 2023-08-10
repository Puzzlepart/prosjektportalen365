import { useState } from 'react'
import SPDataAdapter from '../../../data'
import { useProjectInformationContext } from '../context'
import { CLOSE_PANEL, PROPERTIES_UPDATED } from '../reducer'
import { usePropertiesSync } from '../usePropertiesSync'
import { useModel } from './useModel'
import strings from 'ProjectWebPartsStrings'
import { CustomError } from 'pp365-shared-library/lib/models'
import { MessageBarType } from '@fluentui/react'

/**
 * Hook for submitting the properties to the project and syncing to the hub. Returns
 * a function that can be called to save the properties.
 *
 * @param model Model returned from `useModel`
 */
export function useSubmit(model: ReturnType<typeof useModel>) {
  const context = useProjectInformationContext()
  const { syncPropertyItemToHub } = usePropertiesSync(context)
  const [saveStatus, setSaveStatus] = useState(null)
  const [error, setError] = useState<CustomError>(null)

  /**
   * Save the properties to the project, and sync to the hub, then
   * clear the local storage and close the panel.
   */
  const onSave = async () => {
    setSaveStatus(strings.UpdatingProjectPropertiesStatusText)
    try {
      await SPDataAdapter.project.updateProjectProperties(model.properties)
    } catch (e) {
      setError(CustomError.createError(e, MessageBarType.error, strings.UpdatingProjectPropertiesErrorText))
      setSaveStatus(null)
      return
    }
    setSaveStatus(strings.SynchronizingProjectPropertiesToPortfolioSiteStatusText)
    try {
      await syncPropertyItemToHub(() => null, model.properties)
    } catch (e) {
      setError(CustomError.createError(e, MessageBarType.error, strings.SynchronizingProjectPropertiesToPortfolioSiteErrorText))
      setSaveStatus(null)
      return
    }
    localStorage.clear()
    context.dispatch(CLOSE_PANEL())
    context.dispatch(PROPERTIES_UPDATED({ refetch: true }))
    setSaveStatus(null)
  }

  return { onSave, saveStatus, error }
}
