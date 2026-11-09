import { getDateForExcelExport } from './getDateForExcelExport'
import { setPageContextInfo } from './pageContext'
import { HONOLULU_TIME_ZONE, OSLO_TIME_ZONE } from './testFixtures'

/**
 * The Excel export's date text, as the list shows the date. Jest cannot move the machine's time
 * zone (its `process.env` is a copy), so the site's zone varies here, and the machine-zone matrix
 * runs in `test/runtime/dates.runtime.test.mjs`.
 */

/** 3 April 2026 on an Oslo site, a date-only field stored as the site's midnight: 22:00Z the day before. */
const STORED = '2026-04-02T22:00:00Z'

/** The instant's day and time in the machine's own zone, by ICU: "2026-04-03 00:00" in Oslo. */
const inMachineZone = (iso: string) =>
  new Date(iso)
    .toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    .replace(/\s+/g, ' ')

describe('getDateForExcelExport', () => {
  afterEach(() => setPageContextInfo(undefined))

  it("writes the day, and the time when asked, in the machine's time zone without a site time zone", () => {
    // On CI's UTC runner this is 2026-04-02, the day before the site's.
    const [day, time] = inMachineZone(STORED).split(' ')
    expect(getDateForExcelExport(STORED)).toBe(day)
    expect(getDateForExcelExport(STORED, true)).toBe(`${day} ${time}`)
    expect(getDateForExcelExport(new Date(STORED))).toBe(day)
  })

  it("writes the day the site's list shows once the page gave the site's time zone", () => {
    setPageContextInfo({ webTimeZoneData: OSLO_TIME_ZONE })
    expect(getDateForExcelExport(STORED)).toBe('2026-04-03')
    expect(getDateForExcelExport(STORED, true)).toBe('2026-04-03 00:00')
    // A site in Hawaii, west of any machine the tests run on: noon the day before there.
    setPageContextInfo({ webTimeZoneData: HONOLULU_TIME_ZONE })
    expect(getDateForExcelExport(STORED)).toBe('2026-04-02')
    expect(getDateForExcelExport(STORED, true)).toBe('2026-04-02 12:00')
  })

  it('writes nothing for no value, and for text that is not a date', () => {
    expect(getDateForExcelExport(undefined)).toBe('')
    expect(getDateForExcelExport('')).toBe('')
    expect(getDateForExcelExport('ikke en dato')).toBe('')
  })
})
