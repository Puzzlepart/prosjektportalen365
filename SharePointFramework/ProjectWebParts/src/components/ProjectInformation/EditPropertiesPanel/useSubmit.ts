import { MessageBarType } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import { IProjectInformationData } from 'pp365-shared-library'
import { CustomError } from 'pp365-shared-library/lib/models'
import { useState } from 'react'
import SPDataAdapter from '../../../data'
import { useProjectInformationContext } from '../context'
import { CLOSE_PANEL, UPDATE_DATA } from '../reducer'
import { usePropertiesSync } from '../usePropertiesSync'
import { UseModelReturnType } from './useModel'

/**
 * Hook for submitting the properties to the project and syncing to the hub. Returns
 * a function that can be called to save the properties.
 *
 * @param model Model returned from `useModel`
 */
export function useSubmit(model: UseModelReturnType) {
  const context = useProjectInformationContext()
  const { syncPropertyItemToHub } = usePropertiesSync(context)
  const [saveStatus, setSaveStatus] = useState(null)
  const [error, setError] = useState<CustomError>(null)

  /**
   * Save the properties to the project, and sync to the hub, then
   * clear the local storage and close the panel.
   */
  const onSave = async () => {
    let data: IProjectInformationData = null
    setError(null)
    setSaveStatus(strings.UpdatingProjectPropertiesStatusText)
    try {
      data = await SPDataAdapter.project.updateProjectProperties(model.properties, true)
    } catch (e) {
      setError(
        CustomError.createError(e, MessageBarType.error, strings.UpdatingProjectPropertiesErrorText)
      )
      setSaveStatus(null)
      setTimeout(() => {
        setError(null)
      }, 5000)
      return
    }
    setSaveStatus(strings.SynchronizingProjectPropertiesToPortfolioSiteStatusText)
    try {
      await syncPropertyItemToHub(data)
    } catch (e) {
      setError(
        CustomError.createError(
          e,
          MessageBarType.error,
          strings.SynchronizingProjectPropertiesToPortfolioSiteErrorText
        )
      )
      setSaveStatus(null)
      setTimeout(() => {
        setError(null)
      }, 5000)
      return
    }
    localStorage.clear()
    context.dispatch(UPDATE_DATA({ data }))
    context.dispatch(CLOSE_PANEL())
    setTimeout(() => {
      setSaveStatus(null)
    }, 500)
  }

  return { onSave, saveStatus, error }
}

export type UseSubmitReturnType = ReturnType<typeof useSubmit>
