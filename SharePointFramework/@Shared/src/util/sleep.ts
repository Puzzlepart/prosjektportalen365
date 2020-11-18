/**
 * Sleep for the specified amount of seconds
 *
 * @param {number} seconds Seconds to sleep
 */
export function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, seconds * 1000)
  })
}
