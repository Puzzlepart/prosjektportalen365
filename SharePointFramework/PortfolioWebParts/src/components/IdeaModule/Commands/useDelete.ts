import { useIdeaModuleContext } from '../context'

/**
 * Hook for deletion of idea. Returns a callback function
 * for deleting the selected report.
 *
 * @returns A function callback
 */
export const useDelete = () => {
  const context = useIdeaModuleContext()
  return async (): Promise<void> => {
    // TODO: Implement the useDelete hook
    // console.log('delete', context)
  }
}
