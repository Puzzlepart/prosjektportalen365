/**
 * Writes object entries to the page fragment without URL encoding.
 */
export function setUrlHash(hashObject: Record<string, any>): void {
  let hash = '#'
  const hashParts = Object.keys(hashObject).map((key) => `${key}=${hashObject[key]}`)
  hash += hashParts.join('&')
  document.location.hash = hash
}
