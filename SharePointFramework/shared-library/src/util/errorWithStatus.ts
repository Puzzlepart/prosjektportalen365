/**
 * An error with a text for the user and the HTTP status that explains it, where one is known. A
 * web part that finds the hub out of reach throws its own error, with a text and nothing else:
 * `PortalDataService` met the refusal earlier and swallowed it. Given the status the service kept
 * (`unavailableStatus`), usage statistics count the failure by it (`errorCodeFrom`), as denied
 * permission for a 401 or a 403, and what the user sees is the same.
 *
 * @param message The text the user sees
 * @param status The HTTP status behind the failure. Without one the error gets no `status`
 */
export function errorWithStatus(message: string, status?: number): Error {
  const error = new Error(message)
  return typeof status === 'number' && isFinite(status) ? Object.assign(error, { status }) : error
}
