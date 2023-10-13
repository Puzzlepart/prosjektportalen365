import { ICustomEditPanelSubmitProps } from 'pp365-shared-library'
import { useState } from 'react'

export function useEditStatusPanelSubmit(): ICustomEditPanelSubmitProps {
  const [state] = useState<Pick<ICustomEditPanelSubmitProps, 'error' | 'saveProgressText'>>({
    error: null,
    saveProgressText: null
  })

  return {
    ...state,
    onSubmit: async ({ properties }) => {
      // TODO: Implement submit logic
    }
  }
}
