import { errorWithCause } from '../util/errorWithCause'
import { TELEMETRY_ERROR_CODES, TELEMETRY_HTTP_STATUSES } from './contract'
import { errorCodeFrom, errorHttpStatusFrom, httpStatusOf } from './errorCode'

/** An error with an HTTP status, as PnPjs gives one: the response body is in the message. */
const httpError = (status: number, body: string = '{}') =>
  Object.assign(new Error(`Error making HttpClient request in queryable [${status}] ::> ${body}`), {
    status
  })

/** An error named as the browser names an aborted request or a timeout. */
const namedError = (name: string, message: string = 'The operation was aborted.') =>
  Object.assign(new Error(message), { name })

/** The text a failed fetch shows the user in place of what SharePoint answered. */
const GENERIC_TEXT = 'Kunne ikke hente statusrapportene.'

/** An error wrapped in the generic text `depth` times, so that it is `depth` causes down. */
const wrapped = (error: unknown, depth: number): unknown =>
  depth === 0 ? error : errorWithCause(GENERIC_TEXT, wrapped(error, depth - 1))

/**
 * The error code is all that is sent of an error. It comes from the HTTP status or the error's
 * type, never from its text, which can hold a URL, a title or a login name.
 */
describe('errorCodeFrom', () => {
  it.each([
    [401, 'permission_denied'],
    [403, 'permission_denied'],
    [404, 'not_found'],
    [429, 'throttled'],
    [500, 'server_error'],
    [502, 'server_error'],
    [503, 'server_error'],
    [504, 'server_error'],
    [599, 'server_error'],
    [0, 'network'],
    [400, 'unknown'],
    [409, 'unknown'],
    [412, 'unknown'],
    [418, 'unknown'],
    [200, 'unknown']
  ])('takes the status %d as %s', (status, code) => {
    expect(errorCodeFrom(httpError(status))).toBe(code)
  })

  it('finds the status where the solutions put it', () => {
    expect(errorCodeFrom({ statusCode: 403 })).toBe('permission_denied')
    expect(errorCodeFrom({ response: { status: 404 } })).toBe('not_found')
    expect(errorCodeFrom({ data: { status: 429 } })).toBe('throttled')
    expect(errorCodeFrom({ status: 503, response: { status: 404 } })).toBe('server_error')
  })

  it('takes an aborted request and a timeout as a timeout, by the name of the error', () => {
    expect(errorCodeFrom(namedError('AbortError'))).toBe('timeout')
    expect(errorCodeFrom(namedError('TimeoutError'))).toBe('timeout')
    expect(errorCodeFrom(Object.assign(namedError('AbortError'), { status: 0 }))).toBe('timeout')
    // The status says more than the name when there is one.
    expect(errorCodeFrom(Object.assign(namedError('AbortError'), { status: 404 }))).toBe(
      'not_found'
    )
  })

  it('never reads the text of an error', () => {
    expect(errorCodeFrom(new Error('[403] Forbidden'))).toBe('unknown')
    expect(errorCodeFrom(new Error('Request timed out'))).toBe('unknown')
    expect(errorCodeFrom(new TypeError('Failed to fetch'))).toBe('unknown')
    expect(errorCodeFrom('404 Not Found')).toBe('unknown')
    expect(errorCodeFrom(httpError(404, 'Access denied to https://contoso.sharepoint.com'))).toBe(
      'not_found'
    )
    expect(errorCodeFrom({ status: '403' })).toBe('unknown')
    expect(errorCodeFrom({ name: 'timeout' })).toBe('unknown')
  })

  it('takes nothing as unknown', () => {
    expect(errorCodeFrom(undefined)).toBe('unknown')
    expect(errorCodeFrom(null)).toBe('unknown')
    expect(errorCodeFrom({})).toBe('unknown')
    expect(errorCodeFrom(42)).toBe('unknown')
    expect(errorCodeFrom({ status: NaN })).toBe('unknown')
  })

  it('gives codes of the contract only, and never the two a caller must pass itself', () => {
    const errors = [0, 400, 401, 403, 404, 429, 500, 503].map((status) => httpError(status))
    errors.forEach((error) => {
      const code = errorCodeFrom(error)
      expect(TELEMETRY_ERROR_CODES).toContain(code)
      expect(['render_failed', 'provisioning_failed']).not.toContain(code)
    })
  })
})

/**
 * A fetch that fails shows the user a generic text and keeps the error SharePoint gave as its
 * cause (`errorWithCause`). The code is read from the nearest error in that chain that has an
 * HTTP status or a timeout's name.
 */
describe('errorCodeFrom, for an error made from another', () => {
  it('finds the status on the cause when the error itself has none', () => {
    expect(errorCodeFrom(errorWithCause(GENERIC_TEXT, httpError(403)))).toBe('permission_denied')
    expect(errorCodeFrom(errorWithCause(GENERIC_TEXT, httpError(404)))).toBe('not_found')
    expect(errorCodeFrom(errorWithCause(GENERIC_TEXT, { response: { status: 429 } }))).toBe(
      'throttled'
    )
    expect(errorCodeFrom(errorWithCause(GENERIC_TEXT, httpError(0)))).toBe('network')
  })

  it('finds the name of a timeout on the cause', () => {
    expect(errorCodeFrom(errorWithCause(GENERIC_TEXT, namedError('AbortError')))).toBe('timeout')
  })

  it("finds the status on a cause's cause, and no deeper than three causes", () => {
    expect(errorCodeFrom(wrapped(httpError(503), 2))).toBe('server_error')
    expect(errorCodeFrom(wrapped(httpError(503), 3))).toBe('server_error')
    expect(errorCodeFrom(wrapped(httpError(503), 4))).toBe('unknown')
  })

  it('takes the nearest error that tells something: the status of the error itself wins', () => {
    const outer = Object.assign(errorWithCause(GENERIC_TEXT, httpError(403)), { status: 404 })
    expect(errorCodeFrom(outer)).toBe('not_found')
    // A status the contract has no code for is still the error's own.
    const teapot = Object.assign(errorWithCause(GENERIC_TEXT, httpError(403)), { status: 418 })
    expect(errorCodeFrom(teapot)).toBe('unknown')
    const aborted = Object.assign(errorWithCause(GENERIC_TEXT, httpError(403)), {
      name: 'AbortError'
    })
    expect(errorCodeFrom(aborted)).toBe('timeout')
    const nearest = errorWithCause(
      GENERIC_TEXT,
      Object.assign(errorWithCause(GENERIC_TEXT, httpError(500)), { status: 404 })
    )
    expect(errorCodeFrom(nearest)).toBe('not_found')
  })

  it('ends at a cause that points back at its own error', () => {
    const own: Record<string, any> = new Error(GENERIC_TEXT)
    own.cause = own
    expect(errorCodeFrom(own)).toBe('unknown')
    const first: Record<string, any> = new Error(GENERIC_TEXT)
    const second: Record<string, any> = errorWithCause(GENERIC_TEXT, first)
    first.cause = second
    expect(errorCodeFrom(first)).toBe('unknown')
    expect(errorHttpStatusFrom(first)).toBeUndefined()
  })

  it('ignores a cause that is no object', () => {
    expect(errorCodeFrom(errorWithCause(GENERIC_TEXT, '[403] Forbidden'))).toBe('unknown')
    expect(errorCodeFrom(errorWithCause(GENERIC_TEXT, 403))).toBe('unknown')
    expect(errorCodeFrom(errorWithCause(GENERIC_TEXT, undefined))).toBe('unknown')
    expect(errorCodeFrom(errorWithCause(GENERIC_TEXT, null))).toBe('unknown')
    expect(errorCodeFrom({ cause: 'AbortError' })).toBe('unknown')
  })

  it('never reads the text of a cause', () => {
    expect(errorCodeFrom(errorWithCause(GENERIC_TEXT, new Error('[403] Forbidden')))).toBe(
      'unknown'
    )
    expect(errorCodeFrom(errorWithCause(GENERIC_TEXT, new TypeError('Failed to fetch')))).toBe(
      'unknown'
    )
    expect(errorCodeFrom(errorWithCause('[404] Not Found', httpError(403, 'Not Found 404')))).toBe(
      'permission_denied'
    )
  })
})

describe('errorHttpStatusFrom', () => {
  it('gives the status when the contract allows it', () => {
    TELEMETRY_HTTP_STATUSES.forEach((status) => {
      expect(errorHttpStatusFrom(httpError(status))).toBe(status)
    })
    expect(errorHttpStatusFrom({ response: { status: 412 } })).toBe(412)
  })

  it('leaves any other status out', () => {
    expect(errorHttpStatusFrom(httpError(418))).toBeUndefined()
    expect(errorHttpStatusFrom(httpError(599))).toBeUndefined()
    expect(errorHttpStatusFrom(new Error('[403] Forbidden'))).toBeUndefined()
    expect(errorHttpStatusFrom(undefined)).toBeUndefined()
    expect(errorHttpStatusFrom({ status: '403' })).toBeUndefined()
  })

  it('follows the causes as the code does, so the two are read from the same error', () => {
    expect(errorHttpStatusFrom(errorWithCause(GENERIC_TEXT, httpError(403)))).toBe(403)
    expect(errorHttpStatusFrom(wrapped(httpError(503), 3))).toBe(503)
    expect(errorHttpStatusFrom(wrapped(httpError(503), 4))).toBeUndefined()
    // The error's own status wins, also one the contract leaves out.
    const outer = Object.assign(errorWithCause(GENERIC_TEXT, httpError(403)), { status: 404 })
    expect(errorHttpStatusFrom(outer)).toBe(404)
    const teapot = Object.assign(errorWithCause(GENERIC_TEXT, httpError(403)), { status: 418 })
    expect(errorHttpStatusFrom(teapot)).toBeUndefined()
    // A timeout by its name has no status, whatever the error it was made from had.
    const aborted = Object.assign(errorWithCause(GENERIC_TEXT, httpError(403)), {
      name: 'AbortError'
    })
    expect(errorHttpStatusFrom(aborted)).toBeUndefined()
    expect(errorHttpStatusFrom(errorWithCause(GENERIC_TEXT, '403'))).toBeUndefined()
  })
})

describe('httpStatusOf', () => {
  it("gives the error's own status, wherever the solutions put it and whatever it is", () => {
    expect(httpStatusOf(httpError(403))).toBe(403)
    expect(httpStatusOf({ statusCode: 401 })).toBe(401)
    expect(httpStatusOf({ response: { status: 404 } })).toBe(404)
    expect(httpStatusOf({ data: { status: 500 } })).toBe(500)
    // A status the contract leaves out of an error entry is still the error's status.
    expect(httpStatusOf(httpError(418))).toBe(418)
  })

  it('follows no cause, and takes only a number for a status', () => {
    expect(httpStatusOf(errorWithCause(GENERIC_TEXT, httpError(403)))).toBeUndefined()
    expect(httpStatusOf({ status: '403' })).toBeUndefined()
    expect(httpStatusOf({ status: NaN })).toBeUndefined()
    expect(httpStatusOf(new Error('[403] Forbidden'))).toBeUndefined()
    expect(httpStatusOf('403')).toBeUndefined()
    expect(httpStatusOf(undefined)).toBeUndefined()
    expect(httpStatusOf(null)).toBeUndefined()
  })
})
