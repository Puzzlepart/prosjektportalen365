import { errorWithCause } from './errorWithCause'

/** An error with an HTTP status, as PnPjs gives one: the response body is in the message. */
const httpError = (status: number) =>
  Object.assign(new Error(`Error making HttpClient request in queryable [${status}] ::> {}`), {
    status
  })

/**
 * The error a failed fetch shows: the generic text is all the user sees, and the error it was
 * made from stays reachable as its cause.
 */
describe('errorWithCause', () => {
  it('gives an error with the text for the user, and nothing of what was caught in it', () => {
    const error = errorWithCause('Kunne ikke hente statusrapportene.', httpError(403))
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Kunne ikke hente statusrapportene.')
    expect(error.name).toBe('Error')
    expect((error as any).status).toBeUndefined()
  })

  it('keeps the caught error as its cause, the same object', () => {
    const caught = httpError(404)
    expect((errorWithCause('Fant ikke listen.', caught) as any).cause).toBe(caught)
  })

  it('keeps the cause out of a spread and a serialised error, as the native cause is', () => {
    const error = errorWithCause('Fant ikke listen.', httpError(404))
    expect(Object.keys(error)).toEqual([])
    expect(JSON.stringify(error)).toBe('{}')
    expect({ ...error }).toEqual({})
  })

  it('takes a cause of any shape, as a catch gives one', () => {
    expect((errorWithCause('Feil', 'Access denied.') as any).cause).toBe('Access denied.')
    expect((errorWithCause('Feil', { status: 429 }) as any).cause).toEqual({ status: 429 })
    expect((errorWithCause('Feil', undefined) as any).cause).toBeUndefined()
    expect((errorWithCause('Feil', null) as any).cause).toBeNull()
  })

  it('wraps an error that is itself a wrap', () => {
    const caught = httpError(503)
    const inner = errorWithCause('Fant ikke prosjektet.', caught)
    const outer = errorWithCause('Kunne ikke hente tidslinjen.', inner)
    expect((outer as any).cause).toBe(inner)
    expect((outer as any).cause.cause).toBe(caught)
  })
})
