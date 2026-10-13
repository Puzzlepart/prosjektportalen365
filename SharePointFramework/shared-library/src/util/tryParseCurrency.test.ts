import { tryParseCurrency } from './tryParseCurrency'

/**
 * An amount grouped in SharePoint's UI language, not the browser's (jsdom's is en-US). ICU groups
 * Norwegian thousands with a no-break space, so the texts are compared with plain spaces.
 */
const plain = (text: string) => text.replace(/\s/g, ' ')

describe('tryParseCurrency', () => {
  afterEach(() => {
    delete (window as any)._spPageContextInfo
  })

  it("groups the amount in SharePoint's UI language", () => {
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'nb-NO' }
    expect(plain(tryParseCurrency('1234567'))).toBe('kr 1 234 567')
    expect(plain(tryParseCurrency('1234.5', '', 'kr', 0, 2))).toBe('kr 1 234,5')
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'en-US' }
    expect(tryParseCurrency('1234567')).toBe('kr 1,234,567')
  })

  it('returns the fallback for a value that is not a number', () => {
    expect(tryParseCurrency('', 'Ikke satt')).toBe('Ikke satt')
    expect(tryParseCurrency('mye', 'Ikke satt')).toBe('Ikke satt')
  })
})
