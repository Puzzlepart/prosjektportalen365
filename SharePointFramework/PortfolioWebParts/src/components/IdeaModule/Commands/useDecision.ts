import { useIdeaModuleContext } from '../context'

/**
 * Hook for setting the decision for ideas. Returns a callback function for setting the decision.
 *
 * @returns A function callback that returns a promise of void
 */
export const useDecision = () => {
  const context = useIdeaModuleContext()
  return async (): Promise<void> => {
    // TODO: Implement the useDecision hook
    // console.log('decide', context)
  }
}
