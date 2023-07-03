/**
 * Redirect to URL. If `appendSource` is `true` (default) the current URL is appended as a
 * query string parameter `Source`.
 *
 * @param url Url to redirect to
 * @param appendSource Append source (defaults to `true`)
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
