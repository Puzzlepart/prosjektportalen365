/**
 * An error with a text for the user and the error it was made from as its `cause`. A fetch that
 * fails shows a generic, localized text instead of what SharePoint answered. With the cause kept,
 * usage statistics still reach the original error's HTTP status (`errorCodeFrom`), and the
 * console still shows the original under the text.
 *
 * The property is defined here: the solutions compile against the es2020 `lib`, which has no
 * `new Error(message, { cause })`. It is not enumerable, as the native one is not, so the cause
 * does not follow the error into a spread or a `JSON.stringify`.
 *
 * @param message The text the user sees
 * @param cause The caught error, of any shape
 */
export function errorWithCause(message: string, cause: unknown): Error {
  const error = new Error(message)
  Object.defineProperty(error, 'cause', {
    value: cause,
    writable: true,
    configurable: true,
    enumerable: false
  })
  return error
}
