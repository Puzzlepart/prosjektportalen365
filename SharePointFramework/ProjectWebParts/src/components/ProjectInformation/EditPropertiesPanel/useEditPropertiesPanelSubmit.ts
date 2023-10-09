import strings from 'ProjectWebPartsStrings'
import SPDataAdapter from 'data'
import { IProjectInformationData } from 'pp365-shared-library'
import { ICustomEditPanelSubmitProps } from 'pp365-shared-library/lib/components/CustomEditPanel/types'
import { useState } from 'react'
import { useProjectInformationContext } from '../context'
import { CLOSE_PANEL, UPDATE_DATA } from '../reducer'
import { usePropertiesSync } from '../usePropertiesSync'

/**
 * Returns an object containing the `onSubmit` function, `error` state, and `saveProgressText` state
 * for handling the submission of the edit properties panel form.
 * 
 * @returns An object containing the `onSubmit` function, `error` state, and `saveProgressText` state.
 */
export function useEditPropertiesPanelSubmit(): ICustomEditPanelSubmitProps {
  const context = useProjectInformationContext()
  const { syncPropertyItemToHub } = usePropertiesSync(context)
  const [error, setError] = useState(null)
  const [saveProgressText, setSaveProgressText] = useState(null)


  /**
   * Handles the submission of the edit properties panel form.
   * 
   * @param properties The updated project properties.
   * 
   * @returns void
   */
  const onSubmit: ICustomEditPanelSubmitProps['onSubmit'] = async (properties) => {
    let data: IProjectInformationData = null
    setError(null)
    setSaveProgressText(strings.UpdatingProjectPropertiesStatusText)
    try {
      data = await SPDataAdapter.project.updateProjectProperties(properties, true)
    } catch (e) {
      setError(strings.UpdatingProjectPropertiesErrorText)
      setSaveProgressText(null)
      setTimeout(() => {
        setError(null)
      }, 5000)
      return
    }
    setSaveProgressText(strings.SynchronizingProjectPropertiesToPortfolioSiteStatusText)
    try {
      await syncPropertyItemToHub(data)
    } catch (e) {
      setError(strings.SynchronizingProjectPropertiesToPortfolioSiteErrorText)
      setSaveProgressText(null)
      setTimeout(() => {
        setError(null)
      }, 5000)
      return
    }
    localStorage.clear()
    context.dispatch(UPDATE_DATA({ data }))
    context.dispatch(CLOSE_PANEL())
    setSaveProgressText(null)
  }

  return { onSubmit, error, saveProgressText }
}
