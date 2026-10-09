import { formatDate, formatShortDate, parseShortDate } from './formatDate'

/**
 * Dates as the user reads them: in SharePoint's UI language (the language of the strings beside
 * them), never the browser's. ICU separates the time and the day period with no-break spaces, so
 * the texts are compared with plain spaces.
 */
const plain = (text: string) => text.replace(/\s/g, ' ')

/** Friday 18 November 2022, 09:05 in the machine's time zone. */
const DATE = new Date(2022, 10, 18, 9, 5)

afterEach(() => {
  delete (window as any)._spPageContextInfo
  document.documentElement.removeAttribute('lang')
})

describe('formatShortDate', () => {
  it('writes the date as numbers in the order of the language', () => {
    expect(formatShortDate(DATE, false, '', 'nb-NO')).toBe('18.11.2022')
    expect(formatShortDate(DATE, false, '', 'en-US')).toBe('11/18/2022')
  })

  it('adds hours and minutes when asked for the time', () => {
    expect(plain(formatShortDate(DATE, true, '', 'nb-NO'))).toBe('18.11.2022, 09:05')
    expect(plain(formatShortDate(DATE, true, '', 'en-US'))).toBe('11/18/2022, 09:05 AM')
  })

  it('reads a date string', () => {
    expect(formatShortDate('2022-11-18T09:05:00', false, '', 'nb-NO')).toBe('18.11.2022')
  })

  it('returns the fallback for no date and for text that is not a date', () => {
    expect(formatShortDate(undefined, false, 'Ikke satt', 'nb-NO')).toBe('Ikke satt')
    expect(formatShortDate('', false, 'Ikke satt', 'nb-NO')).toBe('Ikke satt')
    expect(formatShortDate('ikke en dato', false, 'Ikke satt', 'nb-NO')).toBe('Ikke satt')
  })

  it("follows SharePoint's UI language by default, not the browser's", () => {
    document.documentElement.lang = 'nb-NO'
    expect(formatShortDate(DATE)).toBe('18.11.2022')
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'en-US' }
    expect(formatShortDate(DATE)).toBe('11/18/2022')
  })
})

describe('formatDate', () => {
  it('keeps the long form with the weekday', () => {
    expect(formatDate(DATE, false, '', 'nb-NO')).toBe('fredag 18. nov. 2022')
    expect(plain(formatDate(DATE, true, '', 'nb-NO'))).toBe('fredag 18. nov. 2022, 09:05')
    expect(formatDate(undefined, false, 'Ikke satt')).toBe('Ikke satt')
  })

  it("follows SharePoint's UI language by default, so an English site gets English dates", () => {
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'en-US' }
    expect(formatDate(DATE)).toBe('Friday, Nov 18, 2022')
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'nb-NO' }
    expect(formatDate(DATE)).toBe('fredag 18. nov. 2022')
  })
})

describe('parseShortDate', () => {
  const day = (year: number, month: number, date: number) => new Date(year, month - 1, date)

  it('reads a date in the order of the language', () => {
    expect(parseShortDate('18.11.2022', 'nb-NO')).toEqual(day(2022, 11, 18))
    expect(parseShortDate('1.2.2022', 'nb-NO')).toEqual(day(2022, 2, 1))
    expect(parseShortDate('11/18/2022', 'en-US')).toEqual(day(2022, 11, 18))
    expect(parseShortDate('18/11/2022', 'en-GB')).toEqual(day(2022, 11, 18))
  })

  it('reads back what formatShortDate writes', () => {
    for (const locale of ['nb-NO', 'en-US', 'en-GB', 'sv-SE', 'de-DE', 'ja-JP']) {
      expect(parseShortDate(formatShortDate(DATE, false, '', locale), locale)).toEqual(
        day(2022, 11, 18)
      )
    }
  })

  it('takes a two-digit year as this century, and a year first as an ISO date', () => {
    expect(parseShortDate('18.11.22', 'nb-NO')).toEqual(day(2022, 11, 18))
    expect(parseShortDate(' 2022-11-18 ', 'nb-NO')).toEqual(day(2022, 11, 18))
  })

  it('leaves the rest to the browser, and rejects what is not a date', () => {
    expect(parseShortDate('Nov 18 2022', 'en-US')).toEqual(day(2022, 11, 18))
    expect(parseShortDate('31.02.2022', 'nb-NO')).toBeUndefined()
    expect(parseShortDate('11/18/2022', 'nb-NO')).toBeUndefined()
    expect(parseShortDate('i morgen', 'nb-NO')).toBeUndefined()
    expect(parseShortDate('', 'nb-NO')).toBeUndefined()
  })

  it("follows SharePoint's UI language by default", () => {
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'en-US' }
    expect(parseShortDate('11/18/2022')).toEqual(day(2022, 11, 18))
  })
})
