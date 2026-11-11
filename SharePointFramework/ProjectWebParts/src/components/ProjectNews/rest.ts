/**
 * A value as a quoted OData string literal for a REST URL, as PnPjs writes a path: its `'`
 * doubled, so a title such as «Prosjektets 'kick-off'» does not end the literal early, and the rest
 * percent-encoded, so a folder or file name with `#` or `%` (which SharePoint allows) reaches
 * SharePoint whole instead of ending the URL or being read as an escape.
 *
 * @param value The value to quote, such as a server-relative path
 */
export function toODataString(value: string): string {
  return `'${encodeURIComponent((value ?? '').replace(/'/g, "''"))}'`
}

/**
 * A server-relative path as the path of a link, each of its segments percent-encoded: a `#`, `%`
 * or space in a folder or file name would otherwise end or garble the address.
 *
 * @param path The server-relative path
 */
export function toUrlPath(path: string): string {
  return (path ?? '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

/**
 * The message of an error, or of the parsed body of a failed REST response, in whichever shape
 * SharePoint gives it: `{ error: { message } }` (OData 4, what SPHttpClient asks for),
 * `{ error: { message: { value } } }` or `{ 'odata.error': { message: { value } } }`.
 *
 * @param error An error, or the parsed body of a failed REST response
 */
export function getRestErrorMessage(error: any): string | undefined {
  const message = (error?.['odata.error'] ?? error?.error)?.message
  return (typeof message === 'string' ? message : message?.value) || error?.message
}
