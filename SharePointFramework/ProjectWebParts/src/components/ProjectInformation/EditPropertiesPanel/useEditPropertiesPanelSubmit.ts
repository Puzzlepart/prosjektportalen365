import strings from 'ProjectWebPartsStrings'
import SPDataAdapter from 'data'
import { IProjectInformationData } from 'pp365-shared-library'
import { ICustomEditPanelSubmitProps } from 'pp365-shared-library/lib/components/CustomEditPanel/types'
import { useCallback, useState } from 'react'
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
  const [state, setState] = useState<Pick<ICustomEditPanelSubmitProps, 'error' | 'saveProgressText'>>({
    error: null,
    saveProgressText: null
  })


  /**
   * Handles the submission of the edit properties panel form.
   * 
   * @param properties The updated project properties.
   * 
   * @returns void
   */
  const onSubmit = useCallback<ICustomEditPanelSubmitProps['onSubmit']>(async (properties) => {
    let data: IProjectInformationData = null
    setState({
      error: null,
      saveProgressText: strings.UpdatingProjectPropertiesStatusText
    })
    try {
      data = await SPDataAdapter.project.updateProjectProperties(properties, true)
    } catch (e) {
      setState({
        error: strings.UpdatingProjectPropertiesErrorText,
        saveProgressText: null
      })
      setTimeout(() => {
        setState(prevState => ({
          ...prevState,
          error: null
        }))
      }, 5000)
      return
    }
    setState(prevState => ({
      ...prevState,
      saveProgressText: strings.SynchronizingProjectPropertiesToPortfolioSiteStatusText
    }))
    try {
      await syncPropertyItemToHub(data)
    } catch (e) {
      setState({
        error: strings.SynchronizingProjectPropertiesToPortfolioSiteErrorText,
        saveProgressText: null
      })
      setTimeout(() => {
        setState(prevState => ({
          ...prevState,
          error: null
        }))
      }, 5000)
      return
    }
    localStorage.clear()
    context.dispatch(UPDATE_DATA({ data }))
    context.dispatch(CLOSE_PANEL())
    setState(prevState => ({
      ...prevState,
      saveProgressText: null
    }))
  }, [state])

  return { onSubmit, ...state }
}
