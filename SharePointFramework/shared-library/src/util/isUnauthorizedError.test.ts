import { isUnauthorizedError } from './isUnauthorizedError'

/** An error with an HTTP status, as PnPjs gives one: the response body is in the message. */
const httpError = (status: number, body: string) =>
  Object.assign(new Error(`Error making HttpClient request in queryable [${status}] ::> ${body}`), {
    status
  })

describe('isUnauthorizedError', () => {
  it('takes 401 and 403 as refused, by the status code', () => {
    expect(isUnauthorizedError(httpError(401, '{}'))).toBe(true)
    expect(isUnauthorizedError(httpError(403, '{}'))).toBe(true)
    expect(isUnauthorizedError({ statusCode: 403 })).toBe(true)
    expect(isUnauthorizedError({ response: { status: 401 } })).toBe(true)
  })

  it('decides by the status when there is one, whatever the message holds', () => {
    // A site id and a title with 403 in them, in a 404 and a throttled request.
    const body = "{'odata.error':{'message':{'value':'Rom-403.aspx b4031c2e-8f40-4a3e-9c40'}}}"
    expect(isUnauthorizedError(httpError(404, body))).toBe(false)
    expect(isUnauthorizedError(httpError(429, body))).toBe(false)
    expect(isUnauthorizedError(httpError(503, 'Forbidden'))).toBe(false)
  })

  it('without a status, takes only the words of a refusal, not the digits', () => {
    expect(isUnauthorizedError(new Error('[403] Forbidden'))).toBe(true)
    expect(isUnauthorizedError(new Error('Attempted to perform an unauthorized operation.'))).toBe(
      true
    )
    expect(isUnauthorizedError('Access denied.')).toBe(true)
    expect(isUnauthorizedError(new Error('0x80070005 (E_ACCESSDENIED)'))).toBe(true)
    expect(
      isUnauthorizedError(
        new Error('Prosjektet med SiteId b4031c2e-8f40-4a3e-9c40-2e4012345678 ble ikke funnet')
      )
    ).toBe(false)
    expect(isUnauthorizedError(new Error('Cannot read properties of undefined (reading Id)'))).toBe(
      false
    )
  })

  it("reads SharePoint's error body", () => {
    expect(
      isUnauthorizedError({
        'odata.error': {
          code: '-2147024891, System.UnauthorizedAccessException',
          message: { lang: 'nb-NO', value: 'Tilgang nektet.' }
        }
      })
    ).toBe(true)
    expect(
      isUnauthorizedError({
        error: { code: '-2130575338, Microsoft.SharePoint.SPException', message: 'Finnes ikke' }
      })
    ).toBe(false)
  })

  it('takes nothing as refused', () => {
    expect(isUnauthorizedError(undefined)).toBe(false)
    expect(isUnauthorizedError(null)).toBe(false)
    expect(isUnauthorizedError({})).toBe(false)
  })
})
