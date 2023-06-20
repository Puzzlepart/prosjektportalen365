/**
 * Set URL hash
 *
 * @param hashObject Hash object
 */
export function setUrlHash(hashObject: Record<string, any>): void {
  let hash = '#'
  const hashParts = Object.keys(hashObject).map(
    (key) => `${key}=${hashObject[key]}`
  )
  hash += hashParts.join('&')
  document.location.hash = hash
}
