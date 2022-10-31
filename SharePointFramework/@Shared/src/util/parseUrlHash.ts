/**
 * Parse url hash
 *
 * @param lowerCase Lower case hash
 */
export function parseUrlHash<T>(lowerCase: boolean = false): T {
  let hash = document.location.hash.substring(1)
  if (lowerCase) {
    hash = hash.toLowerCase()
  }
  return hash.split('&').reduce((obj, str) => {
    const [key, value] = str.split('=')
    if (key && value) {
      obj[key] = value
    }
    return obj
  }, {}) as T
}
