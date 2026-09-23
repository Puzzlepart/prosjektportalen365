import { CustomError } from './CustomError'
import { ErrorWithIntent } from '../interfaces/ErrorWithIntent'

/**
 * These models carry the severity that ends up on a Fluent UI v9 `MessageBar`
 * as its `intent`. v9 takes a string union; the v8 `MessageBarType` they used
 * to carry was a numeric enum, and a number reaching `intent` silently falls
 * back to the default styling, so an error rendered as a neutral message.
 * The tests pin the value as a string for that reason.
 */
describe('CustomError', () => {
  it('keeps the original error message', () => {
    const error = CustomError.createError(new Error('Noe gikk galt'), 'error')
    expect(error.message).toBe('Noe gikk galt')
  })

  it('carries a v9 intent string, not a numeric enum', () => {
    const error = CustomError.createError(new Error('x'), 'error')
    expect(typeof error.type).toBe('string')
    expect(error.type).toBe('error')
  })

  it('supports the intents v9 defines', () => {
    for (const intent of ['info', 'warning', 'error', 'success'] as const) {
      expect(CustomError.createError(new Error('x'), intent).type).toBe(intent)
    }
  })

  it('defaults the custom message to an empty string', () => {
    expect(CustomError.createError(new Error('x'), 'error').customMessage).toBe('')
  })

  it('keeps a custom message when given one', () => {
    const error = CustomError.createError(new Error('x'), 'warning', 'Prøv igjen senere')
    expect(error.customMessage).toBe('Prøv igjen senere')
    expect(error.type).toBe('warning')
  })
})

describe('ErrorWithIntent', () => {
  it('carries message, intent and name', () => {
    const error = new ErrorWithIntent('Ingen visning funnet', 'error', 'ViewNotFound')
    expect(error.message).toBe('Ingen visning funnet')
    expect(error.intent).toBe('error')
    expect(error.name).toBe('ViewNotFound')
  })

  it('defaults the name to Error', () => {
    expect(new ErrorWithIntent('x', 'warning').name).toBe('Error')
  })
})
