/**
 * Redirect to URL
 *
 * @param url Url
 * @param appendSource Append source
 */
export function redirect(url: string, appendSource: boolean = true): void {
  if (appendSource) {
    if (url.indexOf('?') === -1) {
      url = `${url}?Source=${encodeURIComponent(document.location.href)}`
    } else {
      url = `${url}&Source=${encodeURIComponent(document.location.href)}`
    }
  }
  document.location.href = url
}
