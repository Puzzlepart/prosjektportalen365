/**
 * Parse URL hash from `hash` in `window.location`.
 *
 * @param lowerCase Lower case hash (default: `false`)
 */
export function parseUrlHash(lowerCase: boolean = false) {
  let hash = document.location.hash.substring(1)
  if (lowerCase) {
    hash = hash.toLowerCase()
  }
  return hash.split('&').reduce((obj, str) => {
    const [key, value] = str.split('=')
    if (key && value) {
      if (!Number.isNaN(value)) {
        obj.set(key, parseInt(value, 10))
      } else {
        obj.set(key, value)
      }
    }
    return new Map<string, string | number>(obj)
  }, new Map<string, string | number>())
}
