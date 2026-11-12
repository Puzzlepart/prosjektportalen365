import { TelemetryErrorCode, TelemetryHttpStatus } from './contract'
import { telemetryHttpStatus } from './validate'

/**
 * The names of errors that mean a request ran out of time: an aborted request, and a timeout as
 * `AbortSignal.timeout()` and our own code name it.
 */
const TIMEOUT_ERROR_NAMES = ['AbortError', 'TimeoutError']

/**
 * How many causes deep an error is followed. Our own wraps are one or two deep (a fetch's generic
 * error, and the error the web part shows made from that); the bound also ends a `cause` that
 * points back at its own error.
 */
const MAX_CAUSE_DEPTH = 3

/**
 * The HTTP status of an error, where it has one: PnPjs' errors carry `status`, and the errors the
 * solutions make from a response carry it as `statusCode` or under `response` or `data`.
 */
function statusOf(error: unknown): number | undefined {
  const err = (error ?? {}) as Record<string, any>
  const status = [err.status, err.statusCode, err.response?.status, err.data?.status].filter(
    (value) => typeof value === 'number' && isFinite(value)
  )[0]
  return status
}

/** Whether the error is named as a request that ran out of time. */
function isTimeoutError(error: unknown): boolean {
  return TIMEOUT_ERROR_NAMES.indexOf(((error ?? {}) as Record<string, any>).name) !== -1
}

/**
 * The error the code is read from: the error itself when it has an HTTP status or a timeout's
 * name, otherwise the nearest error it was made from (`cause`, as `errorWithCause` sets it) that
 * has one. A fetch that shows the user a generic text keeps the error SharePoint gave as its
 * cause. When no error in the chain tells anything, it is the error itself.
 */
function tellingErrorOf(error: unknown): unknown {
  let current = error
  for (let depth = 0; depth <= MAX_CAUSE_DEPTH; depth++) {
    if (statusOf(current) !== undefined || isTimeoutError(current)) return current
    const cause = ((current ?? {}) as Record<string, any>).cause
    if (typeof cause !== 'object' || cause === null) break
    current = cause
  }
  return error
}

/**
 * The error code telemetry sends for an error at level 3. It comes from the error's HTTP status or
 * its type, never from its message, which can hold URLs, names and titles. An error that has
 * neither is followed to the error it was made from (`tellingErrorOf`). `render_failed` and
 * `provisioning_failed` are not derived here: the code that knows passes them to `trackError`.
 *
 * @param error The caught value, of any shape
 */
export function errorCodeFrom(error: unknown): TelemetryErrorCode {
  const telling = tellingErrorOf(error)
  const status = statusOf(telling)
  if (status === 401 || status === 403) return 'permission_denied'
  if (status === 404) return 'not_found'
  if (status === 429) return 'throttled'
  if (status >= 500) return 'server_error'
  if (isTimeoutError(telling)) return 'timeout'
  if (status === 0) return 'network'
  return 'unknown'
}

/**
 * The error's HTTP status when the contract allows it in an error entry, otherwise `undefined`.
 * It is read from the same error as the code (`tellingErrorOf`).
 *
 * @param error The caught value, of any shape
 */
export function errorHttpStatusFrom(error: unknown): TelemetryHttpStatus | undefined {
  return telemetryHttpStatus(statusOf(tellingErrorOf(error)))
}
