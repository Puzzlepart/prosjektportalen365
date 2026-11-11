/**
 * The machine's time zone against the site's, in a real Node process. Jest's `process.env` is a
 * copy, so a Jest test cannot move the machine's zone (a test that set `process.env.TZ` passed on
 * an Oslo machine for the wrong reason), while Node applies `process.env.TZ` at once to `Date`'s
 * local fields and to `toLocaleString`. So the library's date texts are read here with the machine
 * in five zones (the site's, CI's UTC, one west of the site, two east) and the site in Oslo, as the
 * integration tests read them against the tenant.
 */
import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { formatDate, formatDay, formatShortDate } = require('../../lib-commonjs/util/formatDate.js')
const { getDateForExcelExport } = require('../../lib-commonjs/util/getDateForExcelExport.js')
const { setPageContextInfo } = require('../../lib-commonjs/util/pageContext.js')
const { OSLO_TIME_ZONE } = require('../../lib-commonjs/util/testFixtures.js')

/** 3 April 2026 on an Oslo site, a date-only field stored as the site's midnight: 22:00Z the day before. */
const STORED = '2026-04-02T22:00:00Z'
const TIME_ZONES = ['Europe/Oslo', 'UTC', 'America/New_York', 'Europe/Helsinki', 'Asia/Tokyo']
const machineZone = process.env.TZ
const plain = (text) => text.replace(/\s/g, ' ')

afterEach(() => {
  process.env.TZ = machineZone
  setPageContextInfo(undefined)
})

test("a stored date reads as the site's day and time from a machine in any zone", () => {
  setPageContextInfo({ currentUICultureName: 'nb-NO', webTimeZoneData: OSLO_TIME_ZONE })
  for (const zone of TIME_ZONES) {
    process.env.TZ = zone
    assert.equal(formatShortDate(STORED), '03.04.2026', zone)
    assert.equal(plain(formatShortDate(STORED, true)), '03.04.2026, 00:00', zone)
    assert.equal(formatDate(STORED), 'fredag 3. apr. 2026', zone)
    assert.equal(getDateForExcelExport(STORED), '2026-04-03', zone)
    assert.equal(getDateForExcelExport(STORED, true), '2026-04-03 00:00', zone)
    // A date picker's value is a day at local midnight, written as that day wherever it was picked.
    assert.equal(formatDay(new Date(2026, 3, 3)), '03.04.2026', zone)
  }
})

test("without a site time zone the machine's zone decides, as before: the day before west of the site", () => {
  process.env.TZ = 'America/New_York'
  assert.equal(formatShortDate(STORED, false, '', 'nb-NO'), '02.04.2026')
  assert.equal(formatDate(STORED, false, '', 'nb-NO'), 'torsdag 2. apr. 2026')
  assert.equal(getDateForExcelExport(STORED), '2026-04-02')
  process.env.TZ = 'Asia/Tokyo'
  assert.equal(plain(formatShortDate(STORED, true, '', 'nb-NO')), '03.04.2026, 07:00')
})
