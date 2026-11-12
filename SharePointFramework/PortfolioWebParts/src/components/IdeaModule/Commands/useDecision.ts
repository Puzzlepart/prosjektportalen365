/**
 * Return the placeholder decision callback; it currently performs no action.
 */
export const useDecision = () => {
  return async (): Promise<void> => {
    // TODO: Persist the decision before enabling the command surface.
  }
}
