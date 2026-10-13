import type { DatePickerProps } from '@fluentui/react-datepicker-compat'
import strings from 'SharedLibraryStrings'
import { getUILocale } from './getUILocale'

type CalendarStrings = DatePickerProps['strings']

/**
 * What Fluent's date picker needs to speak a language: the names of the months and days, its own
 * texts, how it writes a date (the header and what a screen reader hears), the first day of the
 * week and the rule for week numbers.
 */
export interface IDatePickerLocalization {
  strings: CalendarStrings
  dateTimeFormatter: DatePickerProps['dateTimeFormatter']
  firstDayOfWeek: DatePickerProps['firstDayOfWeek']
  firstWeekOfYear: DatePickerProps['firstWeekOfYear']
}

/** The first letter in upper case: the picker shows the names on their own, as in a heading. */
function capitalize(text: string, locale: string) {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)
}

/**
 * The first day of the week (0 Sunday to 6 Saturday, as `DayOfWeek`) and the fewest days of the
 * year's first week, from the language's region. Browsers give them through `getWeekInfo()`,
 * Node through `weekInfo`; without either, the American week, or Europe's ISO 8601 week.
 */
function weekOf(locale: string): { firstDay: number; minimalDays: number } {
  try {
    const intlLocale = new Intl.Locale(locale) as any
    const info = intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo
    if (info) return { firstDay: info.firstDay % 7, minimalDays: info.minimalDays }
  } catch {
    // An unknown locale falls through to the region's guess.
  }
  return /-(US|CA)$/i.test(locale)
    ? { firstDay: 0, minimalDays: 1 }
    : { firstDay: 1, minimalDays: 4 }
}

/**
 * Fluent's date picker in SharePoint's UI language: left alone it shows "Wednesday", "December",
 * "Go to today" and "December 16, 2026" on a Norwegian site, starts the week on Sunday and numbers
 * the weeks the American way. The names and the dates come from `Intl`, the texts from the strings,
 * so the picker follows the language the rest of the page is in (`getUILocale`).
 *
 * @param locale Locale, by default SharePoint's UI language
 */
export function getDatePickerLocalization(locale: string = getUILocale()): IDatePickerLocalization {
  const name = (options: Intl.DateTimeFormatOptions, date: Date) =>
    capitalize(new Intl.DateTimeFormat(locale, options).format(date), locale)
  // 4 January 2026 is a Sunday, the first day of the calendar's day names.
  const days = Array.from({ length: 7 }, (_, day) => new Date(2026, 0, 4 + day))
  const months = Array.from({ length: 12 }, (_, month) => new Date(2026, month, 1))
  const { firstDay, minimalDays } = weekOf(locale)
  return {
    strings: {
      months: months.map((date) => name({ month: 'long' }, date)),
      shortMonths: months.map((date) => name({ month: 'short' }, date)),
      days: days.map((date) => name({ weekday: 'long' }, date)),
      shortDays: days.map((date) => name({ weekday: 'narrow' }, date)),
      goToToday: strings.DatePicker.GoToToday,
      prevMonthAriaLabel: strings.DatePicker.PrevMonth,
      nextMonthAriaLabel: strings.DatePicker.NextMonth,
      prevYearAriaLabel: strings.DatePicker.PrevYear,
      nextYearAriaLabel: strings.DatePicker.NextYear,
      prevYearRangeAriaLabel: strings.DatePicker.PrevYearRange,
      nextYearRangeAriaLabel: strings.DatePicker.NextYearRange,
      closeButtonAriaLabel: strings.CloseText,
      weekNumberFormatString: strings.DatePicker.WeekNumber,
      selectedDateFormatString: strings.DatePicker.SelectedDate,
      todayDateFormatString: strings.DatePicker.TodayDate,
      monthPickerHeaderAriaLabel: strings.DatePicker.MonthPickerHeader,
      yearPickerHeaderAriaLabel: strings.DatePicker.YearPickerHeader,
      dayMarkedAriaLabel: strings.DatePicker.DayMarked
    },
    dateTimeFormatter: {
      formatDay: (date) => String(date.getDate()),
      formatMonth: (date, calendar) => calendar.months[date.getMonth()],
      formatYear: (date) => String(date.getFullYear()),
      formatMonthDayYear: (date) =>
        new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
          date
        ),
      formatMonthYear: (date) => name({ month: 'long', year: 'numeric' }, date)
    },
    firstDayOfWeek: firstDay as DatePickerProps['firstDayOfWeek'],
    // FirstWeekOfYear: FirstDay (0) when any day makes a week, FirstFourDayWeek (2) for ISO 8601,
    // FirstFullWeek (1) when it takes seven.
    firstWeekOfYear: (minimalDays >= 7
      ? 1
      : minimalDays >= 4
        ? 2
        : 0) as DatePickerProps['firstWeekOfYear']
  }
}
