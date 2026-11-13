import { errorCodeFrom, errorHttpStatusFrom } from '../telemetry/errorCode'
import { errorWithCause } from './errorWithCause'
import { errorWithStatus } from './errorWithStatus'
import { isUnauthorizedError } from './isUnauthorizedError'

/**
 * The error a web part throws for a hub that is out of reach: the text is all the user sees, and
 * the status the hub refused with is what usage statistics count the failure by.
 */
describe('errorWithStatus', () => {
  it('gives an error with the text for the user and the status', () => {
    const error = errorWithStatus('Du har ikke tilgang til porteføljen.', 403)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Du har ikke tilgang til porteføljen.')
    expect((error as any).status).toBe(403)
  })

  it('is counted as denied permission for a 401 or a 403, also as the cause of the error shown', () => {
    const error = errorWithStatus('Du har ikke tilgang til porteføljen.', 403)
    expect(errorCodeFrom(error)).toBe('permission_denied')
    expect(errorHttpStatusFrom(error)).toBe(403)
    expect(isUnauthorizedError(error)).toBe(true)
    const shown = errorWithCause('Du har ikke tilgang til porteføljen.', errorWithStatus('', 401))
    expect(errorCodeFrom(shown)).toBe('permission_denied')
    expect(errorHttpStatusFrom(shown)).toBe(401)
  })

  it.each([[undefined], [null], ['403'], [NaN]])(
    'gives a plain error, with no status at all, without a status (%p)',
    (status) => {
      const error = errorWithStatus('Fant ikke porteføljen.', status as never)
      expect(error.message).toBe('Fant ikke porteføljen.')
      expect('status' in error).toBe(false)
      expect(errorCodeFrom(error)).toBe('unknown')
      expect(errorHttpStatusFrom(error)).toBeUndefined()
    }
  )
})
