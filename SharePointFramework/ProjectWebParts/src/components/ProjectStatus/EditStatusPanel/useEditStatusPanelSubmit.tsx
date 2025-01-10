import { ICustomEditPanelSubmitProps, parseErrorStack } from 'pp365-shared-library'
import { useState } from 'react'
import SPDataAdapter from '../../../data'
import { useProjectStatusContext } from '../context'
import { CLOSE_PANEL, SELECT_REPORT } from '../reducer'

/**
 * Handling for submitting changes to a status report.
 */
export function useEditStatusPanelSubmit(): ICustomEditPanelSubmitProps {
  const context = useProjectStatusContext()
  const { selectedReport } = context.state
  const [state, setState] = useState<
    Pick<ICustomEditPanelSubmitProps, 'error' | 'saveProgressText'>
  >({
    error: null,
    saveProgressText: null
  })

  const onSubmit = async ({ properties }) => {
    try {
      setState({ error: null })
      const updatedReport = await SPDataAdapter.portalDataService.updateStatusReport(
        selectedReport,
        properties
      )
      context.dispatch(SELECT_REPORT({ report: updatedReport }))
      context.dispatch(CLOSE_PANEL())
    } catch (error) {
      const errorText = parseErrorStack(error.message)
      setState({ error: errorText, saveProgressText: null })
    }
  }

  return {
    ...state,
    onSubmit
  }
}
