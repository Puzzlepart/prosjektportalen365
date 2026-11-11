import { setPageContextInfo } from './pageContext'
import { getSiteTimeZone, siteOffsetMinutes, toSiteWallTime } from './siteTimeZone'
import {
  HONOLULU_TIME_ZONE as HONOLULU,
  NEW_YORK_TIME_ZONE as NEW_YORK,
  OSLO_TIME_ZONE as OSLO,
  SYDNEY_TIME_ZONE as SYDNEY,
  TOKYO_TIME_ZONE as TOKYO
} from './testFixtures'

const at = (iso: string) => new Date(iso)

/** SharePoint's own time zone rules applied to an instant: the offset of the site's wall time. */
describe('siteOffsetMinutes', () => {
  it("follows Oslo's rules: +60 in winter, +120 from the last Sunday of March at 02:00 to the last of October at 03:00", () => {
    expect(siteOffsetMinutes(at('2026-01-15T12:00:00Z'), OSLO)).toBe(60)
    // 2026-03-29 is the last Sunday of March: 02:00 CET is 01:00Z.
    expect(siteOffsetMinutes(at('2026-03-29T00:59:00Z'), OSLO)).toBe(60)
    expect(siteOffsetMinutes(at('2026-03-29T01:00:00Z'), OSLO)).toBe(120)
    expect(siteOffsetMinutes(at('2026-07-10T22:00:00Z'), OSLO)).toBe(120)
    // 2026-10-25 is the last Sunday of October: 03:00 CEST is 01:00Z.
    expect(siteOffsetMinutes(at('2026-10-25T00:59:00Z'), OSLO)).toBe(120)
    expect(siteOffsetMinutes(at('2026-10-25T01:00:00Z'), OSLO)).toBe(60)
  })

  it('takes the last occurrence when the month has four of the weekday', () => {
    // March 2027 has four Sundays, the last on the 28th; October 2027 has five, the last on the 31st.
    expect(siteOffsetMinutes(at('2027-03-28T00:59:00Z'), OSLO)).toBe(60)
    expect(siteOffsetMinutes(at('2027-03-28T01:00:00Z'), OSLO)).toBe(120)
    expect(siteOffsetMinutes(at('2027-10-31T00:59:00Z'), OSLO)).toBe(120)
    expect(siteOffsetMinutes(at('2027-10-31T01:00:00Z'), OSLO)).toBe(60)
  })

  it("follows New York's rules, with the bias east of UTC: -300 in winter, -240 from the second Sunday of March", () => {
    expect(siteOffsetMinutes(at('2026-02-01T12:00:00Z'), NEW_YORK)).toBe(-300)
    // 2026-03-08 is the second Sunday of March: 02:00 EST is 07:00Z.
    expect(siteOffsetMinutes(at('2026-03-08T06:59:00Z'), NEW_YORK)).toBe(-300)
    expect(siteOffsetMinutes(at('2026-03-08T07:00:00Z'), NEW_YORK)).toBe(-240)
    // 2026-11-01 is the first Sunday of November: 02:00 EDT is 06:00Z.
    expect(siteOffsetMinutes(at('2026-11-01T05:59:00Z'), NEW_YORK)).toBe(-240)
    expect(siteOffsetMinutes(at('2026-11-01T06:00:00Z'), NEW_YORK)).toBe(-300)
  })

  it('keeps standard time the whole year where there is no daylight time', () => {
    expect(siteOffsetMinutes(at('2026-01-15T12:00:00Z'), TOKYO)).toBe(540)
    expect(siteOffsetMinutes(at('2026-07-15T12:00:00Z'), TOKYO)).toBe(540)
  })

  it('handles daylight time that spans the new year, as in Sydney', () => {
    expect(siteOffsetMinutes(at('2026-01-15T12:00:00Z'), SYDNEY)).toBe(660)
    expect(siteOffsetMinutes(at('2026-07-15T12:00:00Z'), SYDNEY)).toBe(600)
    expect(siteOffsetMinutes(at('2026-12-15T12:00:00Z'), SYDNEY)).toBe(660)
  })
})

/**
 * The instant as the site's wall time, in the date's local fields. Jest cannot move the machine's
 * time zone (its `process.env` is a copy), so the site's zone varies: the machine-zone matrix runs
 * in `test/runtime/dates.runtime.test.mjs`.
 */
describe('toSiteWallTime', () => {
  afterEach(() => setPageContextInfo(undefined))

  const fields = (date: Date) => [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours()
  ]

  it("holds the site's wall time in the date's local fields", () => {
    // A date-only field stored at an Oslo site's midnight: 6 October 2026 (CEST), noon the day
    // before in Hawaii, the morning of the 6th in Tokyo.
    expect(fields(toSiteWallTime(at('2026-10-05T22:00:00Z'), OSLO))).toEqual([2026, 10, 6, 0])
    expect(fields(toSiteWallTime(at('2026-10-05T22:00:00Z'), HONOLULU))).toEqual([2026, 10, 5, 12])
    expect(fields(toSiteWallTime(at('2026-10-05T22:00:00Z'), TOKYO))).toEqual([2026, 10, 6, 7])
  })

  it("reads the page's zone by default, and leaves the instant alone without one", () => {
    const instant = at('2026-10-05T22:00:00Z')
    expect(toSiteWallTime(instant)).toBe(instant)
    expect(getSiteTimeZone()).toBeUndefined()
    setPageContextInfo({ webTimeZoneData: HONOLULU })
    expect(getSiteTimeZone()).toBe(HONOLULU)
    expect(fields(toSiteWallTime(instant))).toEqual([2026, 10, 5, 12])
  })

  it('leaves what is not a date alone', () => {
    const invalid = new Date('ikke en dato')
    expect(toSiteWallTime(invalid, OSLO)).toBe(invalid)
  })
})
