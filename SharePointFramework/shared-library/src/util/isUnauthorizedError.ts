/**
 * Checks whether the given error represents an unauthorized / forbidden
 * HTTP response. This covers status codes 401 and 403, as well as common
 * error message substrings returned by SharePoint and Microsoft Graph.
 *
 * Used by `PortalDataService._handleAvailabilityError` and by
 * consumer-side hub-access checks (e.g. `ProjectStatus`).
 *
 * @param error The caught error value (any shape)
 *
 * @returns `true` when the error indicates an authorization failure
 */
export function isUnauthorizedError(error: unknown): boolean {
  const err = error as Record<string, any> | undefined
  const message = `${err?.message ?? error ?? ''}`.toLowerCase()
  const status: number | undefined = err?.status ?? err?.data?.status ?? err?.response?.status

  return (
    status === 401 ||
    status === 403 ||
    message.indexOf('403') !== -1 ||
    message.indexOf('401') !== -1 ||
    message.indexOf('forbidden') !== -1 ||
    message.indexOf('unauthorized') !== -1 ||
    message.indexOf('unauthorizedaccessexception') !== -1 ||
    message.indexOf('attempted to perform an unauthorized operation') !== -1
  )
}
