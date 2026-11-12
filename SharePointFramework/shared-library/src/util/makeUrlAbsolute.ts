/**
 * Builds a URL from the current host and a server-relative path.
 */
export function makeUrlAbsolute(serverRelativeUrl: string) {
  const baseUrl = `${window.location.protocol}//${window.location.hostname}`
  if (serverRelativeUrl.indexOf(baseUrl) === 0) return baseUrl
  return baseUrl + serverRelativeUrl
}
