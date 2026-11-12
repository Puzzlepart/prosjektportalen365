/**
 * Resolves after the specified number of seconds using the browser's timer.
 */
export function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, seconds * 1000)
  })
}
