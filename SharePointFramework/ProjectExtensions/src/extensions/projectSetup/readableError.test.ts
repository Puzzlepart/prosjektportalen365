import { ProjectSetupError } from './ProjectSetupError'
import { readableErrorMessage, withReason } from './readableError'

/** What a failed JSOM request rejects with: `{ sender, args }`, `args` saying what went wrong. */
const jsomFailure = (message: string) => ({ sender: {}, args: { get_message: () => message } })

/**
 * The `ProvisioningError` of sp-js-provisioning 1.5.1 for a handler that failed with `cause`: its
 * message is `String(cause)` when the cause has no message of its own.
 */
const provisioningError = (handler: string, cause: unknown) =>
  Object.assign(new Error('[object Object]'), { name: 'ProvisioningError', handler, cause })

describe('readableErrorMessage', () => {
  it('reads a text as it is, and nothing as nothing', () => {
    expect(readableErrorMessage('Listen finnes ikke')).toBe('Listen finnes ikke')
    expect(readableErrorMessage(' ')).toBe('')
    expect(readableErrorMessage('[object Object]')).toBe('')
    expect(readableErrorMessage(undefined)).toBe('')
    expect(readableErrorMessage(null)).toBe('')
    expect(readableErrorMessage(404)).toBe('404')
  })

  it("reads an error's message, and the message in SharePoint's error body", () => {
    expect(readableErrorMessage(new Error('Feltet finnes ikke'))).toBe('Feltet finnes ikke')
    expect(readableErrorMessage({ message: { lang: 'nb-NO', value: 'Tilgang nektet' } })).toBe(
      'Tilgang nektet'
    )
    expect(
      readableErrorMessage({
        error: { code: '-2147024891', message: { lang: 'nb-NO', value: 'Tilgang nektet' } }
      })
    ).toBe('Tilgang nektet')
  })

  it("reads what a failed JSOM request says, also as the cause of the engine's error", () => {
    expect(readableErrorMessage(jsomFailure('Innholdstypen finnes allerede'))).toBe(
      'Innholdstypen finnes allerede'
    )
    expect(
      readableErrorMessage(
        provisioningError('ContentTypes', jsomFailure('Innholdstypen finnes allerede'))
      )
    ).toBe('Innholdstypen finnes allerede')
    expect(readableErrorMessage({ cause: { cause: { cause: 'Tre ledd inn' } }, code: 'E1' })).toBe(
      'Tre ledd inn'
    )
  })

  it('writes what says nothing readable as short JSON: an object, or the cause of an error', () => {
    expect(readableErrorMessage({ error: { code: '500' } })).toBe('{"error":{"code":"500"}}')
    expect(readableErrorMessage(provisioningError('ContentTypes', { code: 'E1' }))).toBe(
      '{"code":"E1"}'
    )
    const circular: Record<string, any> = { code: 'E2' }
    circular.self = circular
    circular.cause = circular
    expect(readableErrorMessage(circular)).toBe('{"code":"E2"}')
    expect(readableErrorMessage({ detail: 'x'.repeat(500) })).toHaveLength(200)
    expect(readableErrorMessage({ cause: { cause: { cause: { cause: 'For langt inn' } } } })).toBe(
      '{"cause":{"cause":{"cause":{"cause":"For langt inn"}}}}'
    )
  })

  it('gives nothing for what has nothing to read and cannot, or need not, be written as JSON', () => {
    expect(readableErrorMessage({})).toBe('')
    expect(readableErrorMessage([])).toBe('')
    expect(
      readableErrorMessage({
        toJSON: () => {
          throw new Error('Kan ikke skrives')
        }
      })
    ).toBe('')
    // The engine's own fields of an error (`handler`) say nothing.
    expect(readableErrorMessage(Object.assign(new Error(''), { handler: 'Hooks' }))).toBe('')
    expect(readableErrorMessage(provisioningError('Hooks', new Error('')))).toBe('')
  })
})

describe('withReason', () => {
  it('adds what the error says, and nothing when it says nothing', () => {
    expect(withReason('Steget feilet', new Error('Tilgang nektet'))).toBe(
      'Steget feilet: Tilgang nektet'
    )
    expect(withReason('Steget feilet', undefined)).toBe('Steget feilet')
  })
})

describe('ProjectSetupError', () => {
  it('shows the failed JSOM request of a step in words, where it showed «[object Object]»', () => {
    const error = new ProjectSetupError(
      'ApplyTemplate',
      'Steget feilet',
      provisioningError('ContentTypes', jsomFailure('Innholdstypen finnes allerede'))
    )
    expect(error.stack).toBe('ProvisioningError: Innholdstypen finnes allerede')
  })

  it('keeps a text, and an error with a message of its own, as they were', () => {
    expect(new ProjectSetupError('Steg', 'Feil', 'Prøv igjen senere').stack).toBe(
      'Prøv igjen senere'
    )
    expect(new ProjectSetupError('Steg', 'Feil', new TypeError('Ugyldig verdi')).stack).toBe(
      'TypeError: Ugyldig verdi'
    )
  })

  it('names what has no name of its own an error, and shows nothing for nothing', () => {
    expect(
      new ProjectSetupError('Steg', 'Feil', { message: { value: 'Tilgang nektet' } }).stack
    ).toBe('Error: Tilgang nektet')
    expect(new ProjectSetupError('Steg', 'Feil', {}).stack).toBe('Error')
    expect(new ProjectSetupError('Steg', 'Feil', undefined).stack).toBeNull()
  })
})
