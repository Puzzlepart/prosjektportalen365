import {
  formatDate,
  formatShortDate,
  parseShortDate,
  readStoredDay,
  toCalendarDate
} from './formatDate'

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

describe('toCalendarDate', () => {
  it("writes the day a date picker picked, which SharePoint reads in the site's time zone", () => {
    // The picker gives the day at local midnight; sent as an instant, that midnight fell on the day
    // before for a machine east of the site (Helsinki and Tokyo on an Oslo site, on the tenant).
    expect(toCalendarDate(new Date(2026, 3, 3))).toBe('2026-04-03')
    expect(toCalendarDate(new Date(2026, 3, 3, 23, 30))).toBe('2026-04-03')
    expect(toCalendarDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('sends no date, and what is not a date, as null', () => {
    expect(toCalendarDate(null)).toBeNull()
    expect(toCalendarDate(undefined)).toBeNull()
    expect(toCalendarDate(new Date('ikke en dato'))).toBeNull()
  })
})

describe('readStoredDay', () => {
  it("reads the day from SharePoint's text, written in the site's time zone and regional format", () => {
    // 3 April stored as midnight on an Oslo site: read as an instant, London and New York got 2 April.
    expect(readStoredDay('2026-04-02T22:00:00Z', '03.04.2026', 'nb-NO')).toEqual(
      new Date(2026, 3, 3)
    )
    expect(readStoredDay('2026-04-03T04:00:00Z', '4/3/2026', 'en-US')).toEqual(new Date(2026, 3, 3))
  })

  it('keeps the stored instant when the text is no date near it, as a format guessed wrong gives', () => {
    // "03.04.2026" read in American order is 4 March, a month from the stored 3 April.
    const stored = new Date('2026-04-02T22:00:00Z')
    expect(readStoredDay('2026-04-02T22:00:00Z', '03.04.2026', 'en-US')).toEqual(stored)
    expect(readStoredDay('2026-04-02T22:00:00Z', '', 'nb-NO')).toEqual(stored)
  })

  it('has no day for no value', () => {
    expect(readStoredDay(undefined, '', 'nb-NO')).toBeUndefined()
  })

  it("reads the text in the site's regional format, not in the UI language", () => {
    ;(window as any)._spPageContextInfo = {
      currentCultureName: 'en-US',
      currentUICultureName: 'nb-NO'
    }
    try {
      expect(readStoredDay('2026-04-03T04:00:00Z', '4/3/2026')).toEqual(new Date(2026, 3, 3))
    } finally {
      delete (window as any)._spPageContextInfo
    }
  })
})
