import strings from 'SharedLibraryStrings'
import { getDatePickerLocalization } from './getDatePickerLocalization'

/**
 * Fluent's date picker speaks English unless told otherwise: "Wednesday", "December", "Go to
 * today", "December 16, 2026" for a screen reader, the week starting on Sunday and US week numbers.
 * Given SharePoint's UI language, it gets the names of the months and days in that language, the
 * picker's own texts from the strings, dates written the language's way, and that language's first
 * day of the week and rule for week numbers.
 */
describe('getDatePickerLocalization', () => {
  const december16 = new Date(2026, 11, 16)

  it('names the months and days in Norwegian, starting each with a capital for the picker', () => {
    const { strings: calendar } = getDatePickerLocalization('nb-NO')
    expect(calendar.months[11]).toBe('Desember')
    expect(calendar.shortMonths[0]).toMatch(/^Jan/)
    // The calendar's days start on Sunday, whatever day the week starts on.
    expect(calendar.days[0]).toBe('Søndag')
    expect(calendar.days[3]).toBe('Onsdag')
    expect(calendar.shortDays).toEqual(['S', 'M', 'T', 'O', 'T', 'F', 'L'])
  })

  it("takes the picker's own texts from the strings", () => {
    const { strings: calendar } = getDatePickerLocalization('nb-NO')
    expect(calendar.goToToday).toBe(strings.DatePicker.GoToToday)
    expect(calendar.prevMonthAriaLabel).toBe(strings.DatePicker.PrevMonth)
    expect(calendar.closeButtonAriaLabel).toBe(strings.CloseText)
    expect(calendar.weekNumberFormatString).toBe(strings.DatePicker.WeekNumber)
  })

  it('writes dates the way the language does, for the header and for screen readers', () => {
    const { strings: calendar, dateTimeFormatter } = getDatePickerLocalization('nb-NO')
    expect(dateTimeFormatter.formatMonthDayYear(december16, calendar)).toBe('16. desember 2026')
    expect(dateTimeFormatter.formatMonthYear(december16, calendar)).toBe('Desember 2026')
    expect(dateTimeFormatter.formatMonth(december16, calendar)).toBe('Desember')
    expect(dateTimeFormatter.formatDay(december16)).toBe('16')
    expect(dateTimeFormatter.formatYear(december16)).toBe('2026')
  })

  it('starts the Norwegian week on Monday and numbers weeks by ISO 8601, the American on Sunday', () => {
    const norwegian = getDatePickerLocalization('nb-NO')
    // DayOfWeek.Monday and FirstWeekOfYear.FirstFourDayWeek.
    expect(norwegian.firstDayOfWeek).toBe(1)
    expect(norwegian.firstWeekOfYear).toBe(2)
    const american = getDatePickerLocalization('en-US')
    expect(american.strings.months[11]).toBe('December')
    expect(american.strings.days[3]).toBe('Wednesday')
    // DayOfWeek.Sunday and FirstWeekOfYear.FirstDay.
    expect(american.firstDayOfWeek).toBe(0)
    expect(american.firstWeekOfYear).toBe(0)
  })
})
