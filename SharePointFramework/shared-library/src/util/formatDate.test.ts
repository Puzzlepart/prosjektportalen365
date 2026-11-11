import {
  formatDate,
  formatDay,
  formatShortDate,
  parseShortDate,
  readStoredDay,
  toCalendarDate
} from './formatDate'
import { setPageContextInfo } from './pageContext'
import { HONOLULU_TIME_ZONE, OSLO_TIME_ZONE, TOKYO_TIME_ZONE } from './testFixtures'

/**
 * Dates as the user reads them: in SharePoint's UI language (the language of the strings beside
 * them), never the browser's, and in the site's time zone, as SharePoint's own lists show them.
 * ICU separates the time and the day period with no-break spaces, so the texts are compared with
 * plain spaces. Jest cannot move the machine's time zone (its `process.env` is a copy), so the
 * site's zone is what varies here: Honolulu lies west of any machine the tests run on, Tokyo east
 * of CI's UTC and the developers' Oslo. The machine-zone matrix runs in
 * `test/runtime/dates.runtime.test.mjs`, in a real Node process.
 */
const plain = (text: string) => text.replace(/\s/g, ' ')

/** Friday 18 November 2022, 09:05 in the machine's time zone. */
const DATE = new Date(2022, 10, 18, 9, 5)

/** 3 April 2026 on an Oslo site, a date-only field stored as the site's midnight: 22:00Z the day before. */
const STORED = '2026-04-02T22:00:00Z'

/** The machine's own zone, named in an expectation: the text of an instant in it, by ICU itself. */
const MACHINE_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone
const inMachineZone = (iso: string, options: Intl.DateTimeFormatOptions) =>
  plain(new Date(iso).toLocaleString('nb-NO', { ...options, timeZone: MACHINE_ZONE }))

afterEach(() => {
  setPageContextInfo(undefined)
  delete (window as any)._spPageContextInfo
  document.documentElement.removeAttribute('lang')
})

describe("dates in the site's time zone", () => {
  it("shows the day and the time the site's lists show once the page gave the site's zone", () => {
    setPageContextInfo({ currentUICultureName: 'nb-NO', webTimeZoneData: OSLO_TIME_ZONE })
    expect(formatShortDate(STORED)).toBe('03.04.2026')
    expect(plain(formatShortDate(STORED, true))).toBe('03.04.2026, 00:00')
    expect(formatDate(STORED)).toBe('fredag 3. apr. 2026')
    expect(plain(formatDate(new Date(STORED), true))).toBe('fredag 3. apr. 2026, 00:00')
    // The same instant on a site in Hawaii is noon the day before, in Tokyo the morning after.
    setPageContextInfo({ currentUICultureName: 'nb-NO', webTimeZoneData: HONOLULU_TIME_ZONE })
    expect(plain(formatShortDate(STORED, true))).toBe('02.04.2026, 12:00')
    expect(formatDate(STORED)).toBe('torsdag 2. apr. 2026')
    setPageContextInfo({ currentUICultureName: 'nb-NO', webTimeZoneData: TOKYO_TIME_ZONE })
    expect(plain(formatShortDate(STORED, true))).toBe('03.04.2026, 07:00')
  })

  it("follows the machine's time zone without a site time zone, as before", () => {
    // On CI's UTC runner this is "02.04.2026", the day before the site's.
    expect(formatShortDate(STORED, false, '', 'nb-NO')).toBe(
      inMachineZone(STORED, { day: '2-digit', month: '2-digit', year: 'numeric' })
    )
    expect(plain(formatDate(STORED, true, '', 'nb-NO'))).toBe(
      inMachineZone(STORED, {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    )
  })
})

describe('formatDay', () => {
  it("writes a picker's day as numbers, never moved to the site's time zone", () => {
    // A site west of any machine these tests run on: the machine's midnight of 3 April is still
    // 2 April there, so an instant moves, a day does not.
    setPageContextInfo({ currentUICultureName: 'nb-NO', webTimeZoneData: HONOLULU_TIME_ZONE })
    expect(formatDay(new Date(2026, 3, 3))).toBe('03.04.2026')
    expect(formatShortDate(new Date(2026, 3, 3))).toBe('02.04.2026')
    expect(formatDay(new Date(2026, 3, 3), 'en-US')).toBe('04/03/2026')
  })

  it('writes nothing for no day, and for what is not a date', () => {
    expect(formatDay(undefined)).toBe('')
    expect(formatDay(new Date('ikke en dato'))).toBe('')
  })
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
