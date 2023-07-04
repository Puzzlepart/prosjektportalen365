import { useContext } from 'react'
import { PortfolioOverviewContext } from '../context'


/**
 * Component logic hook for `ViewFormPanel`.
 */
export function useViewFormPanel() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const context = useContext(PortfolioOverviewContext)



  const onSave = async () => {
    // TODO: Save the view
  }


  return {
    onSave,
    isEditing: false,
    onDismiss: () => {
      // TODO: Dispatch action to close the panel
    }
  } as const
}
