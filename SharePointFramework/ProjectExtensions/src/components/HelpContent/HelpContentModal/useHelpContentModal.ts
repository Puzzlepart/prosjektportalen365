export function useHelpContentModal() {
  /**
   * Get height for the element based on the window height, minus the header
   * and specified offset.
   *
   * @param offset Offset in pixels
   */
  const getHeight = (offset = 0) => ({
    height: window.innerHeight - 100 - offset,
    maxHeight: window.innerHeight - 100 - offset
  })

  return { getHeight } as const
}
