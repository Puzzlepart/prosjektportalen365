/**
 * SharePoint's and PnPjs' own words for a refused request: PnPjs' «[403] Forbidden», SharePoint's
 * `System.UnauthorizedAccessException`, «Attempted to perform an unauthorized operation» and
 * `E_ACCESSDENIED`.
 */
const UNAUTHORIZED_TEXT = /\[40[13]\]|forbidden|unauthorized|accessdenied|access denied/

/**
 * Checks whether the given error represents an unauthorized / forbidden HTTP response (401 or
 * 403). The status code decides when the error has one, as PnPjs' errors and the errors the
 * solutions make from a response do. Without a status, only the words a refusal is given in
 * count, not the digits 401 or 403 anywhere in the message, which a GUID or a title can hold.
 *
 * Used by `PortalDataService._handleAvailabilityError` and by
 * consumer-side hub-access checks (e.g. `ProjectStatus`).
 *
 * @param error The caught error value (any shape): an error, SharePoint's error body or a text
 *
 * @returns `true` when the error indicates an authorization failure
 */
export function isUnauthorizedError(error: unknown): boolean {
  const err = (error ?? {}) as Record<string, any>
  const status = [err.status, err.statusCode, err.data?.status, err.response?.status].find(
    (value) => value !== undefined && value !== null && value !== ''
  )
  const code = Number(status)
  if (status !== undefined && Number.isFinite(code)) return code === 401 || code === 403
  const text = [
    typeof error === 'string' ? error : err.message,
    err['odata.error']?.code,
    err['odata.error']?.message?.value,
    err.error?.code,
    err.error?.message
  ]
    .filter((part) => typeof part === 'string')
    .join(' ')
    .toLowerCase()
  return UNAUTHORIZED_TEXT.test(text)
}
