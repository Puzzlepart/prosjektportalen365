/**
 * A value as a quoted OData string literal for a REST URL, its `'` doubled: a title such as
 * «Prosjektets 'kick-off'» ended the literal early, and the request failed.
 *
 * @param value The value to quote, such as a server-relative URL
 */
export function toODataString(value: string): string {
  return `'${(value ?? '').replace(/'/g, "''")}'`
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
