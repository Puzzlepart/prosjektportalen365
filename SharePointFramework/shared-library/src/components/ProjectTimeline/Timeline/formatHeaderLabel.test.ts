import moment from 'moment'
import { formatHeaderLabel } from './formatHeaderLabel'

const JULY: [moment.Moment, moment.Moment] = [moment('2026-07-15'), moment('2026-08-01')]

/**
 * The timeline's date header wrote «May», «June» and «July» on a Norwegian site: the calendar
 * formats with moment's global language, English unless something sets it (WCAG 3.1.2).
 */
describe('formatHeaderLabel', () => {
  it('names the month in the language it is given, by the room the label has', () => {
    expect(formatHeaderLabel(JULY, 'month', 160, 'nb-NO')).toBe('juli 2026')
    expect(formatHeaderLabel(JULY, 'month', 120, 'nb-NO')).toBe('juli')
    expect(formatHeaderLabel(JULY, 'month', 60, 'nb-NO')).toBe('juli')
    expect(formatHeaderLabel(JULY, 'month', 160, 'en-US')).toBe('July 2026')
    // The narrowest label holds numbers only.
    expect(formatHeaderLabel(JULY, 'month', 40, 'nb-NO')).toMatch(/^07\D26$/)
  })

  it('names the day in the language it is given', () => {
    expect(formatHeaderLabel(JULY, 'day', 160, 'nb-NO')).toBe('onsdag 15. juli 2026')
    expect(formatHeaderLabel(JULY, 'day', 60, 'nb-NO')).toBe('ons. 15.')
  })

  it("keeps the calendar's numbers where a label has no names", () => {
    expect(formatHeaderLabel(JULY, 'year', 160, 'nb-NO')).toBe('2026')
    expect(formatHeaderLabel(JULY, 'year', 40, 'nb-NO')).toBe('26')
    expect(formatHeaderLabel(JULY, 'hour', 60, 'nb-NO')).toBe('00:00')
  })

  it("writes in SharePoint's UI language when none is given, Norwegian when the page names none", () => {
    expect(formatHeaderLabel(JULY, 'month', 120)).toBe('juli')
  })
})
