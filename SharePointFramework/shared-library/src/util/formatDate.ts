import { getUILocale } from './getUILocale'

/** Hours and minutes, added to either form when the time is asked for. */
const TIME: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

/** The date as numbers: "18.11.2022" in Norwegian, "11/18/2022" in American English. */
const SHORT_DATE: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }

/**
 * Formats a date in the long form with the weekday ("fredag 18. nov. 2022"), in SharePoint's UI
 * language unless `locale` is given.
 *
 * @param date Date string or object
 * @param includeTime Include hours and minutes
 * @param fallback Returned when `date` is empty
 * @param locale Locale, by default SharePoint's UI language (`getUILocale`)
 */
export function formatDate(
  date: string | Date,
  includeTime: boolean = false,
  fallback: string = '',
  locale: string = getUILocale()
): string {
  let options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  if (includeTime) {
    options = {
      ...options,
      ...TIME
    }
  }
  if (!date) return fallback
  return (typeof date === 'string' ? new Date(date) : date).toLocaleString(locale, options)
}

/**
 * Formats a date as numbers ("18.11.2022", "11/18/2022" in American English), in SharePoint's UI
 * language unless `locale` is given. For field values, where `formatDate`'s weekday is noise.
 *
 * @param date Date string or object
 * @param includeTime Include hours and minutes ("18.11.2022, 09:05")
 * @param fallback Returned when `date` is empty or not a date
 * @param locale Locale, by default SharePoint's UI language (`getUILocale`)
 */
export function formatShortDate(
  date: string | Date,
  includeTime: boolean = false,
  fallback: string = '',
  locale: string = getUILocale()
): string {
  if (!date) return fallback
  const value = typeof date === 'string' ? new Date(date) : date
  if (isNaN(value.getTime())) return fallback
  return value.toLocaleString(locale, includeTime ? { ...SHORT_DATE, ...TIME } : SHORT_DATE)
}

/**
 * Reads a date typed the way `formatShortDate` writes it, so a date picker that shows
 * `formatShortDate` takes the same text back: the three numbers in the order of `locale`
 * ("18.11.2022" in Norwegian, "11/18/2022" in American English), a two-digit year as this
 * century, a four-digit year first as an ISO date. Anything else is left to `Date.parse`.
 *
 * @param text The typed text
 * @param locale Locale, by default SharePoint's UI language (`getUILocale`)
 *
 * @returns the date at local midnight, or `undefined` when the text is not a date
 */
export function parseShortDate(text: string, locale: string = getUILocale()): Date | undefined {
  const value = text?.trim()
  if (!value) return undefined
  const numbers = /^(\d{1,4})\D+(\d{1,2})\D+(\d{1,4})$/.exec(value)
  if (!numbers) {
    const parsed = Date.parse(value)
    return isNaN(parsed) ? undefined : new Date(parsed)
  }
  const order =
    numbers[1].length === 4
      ? ['year', 'month', 'day']
      : new Intl.DateTimeFormat(locale, SHORT_DATE)
          .formatToParts(new Date(2000, 0, 2))
          .map(({ type }) => type)
          .filter((type) => type === 'year' || type === 'month' || type === 'day')
  const parts: Record<string, number> = {}
  order.forEach((type, index) => {
    parts[type] = parseInt(numbers[index + 1], 10)
  })
  const year = parts.year < 100 ? 2000 + parts.year : parts.year
  const result = new Date(year, parts.month - 1, parts.day)
  // `Date` rolls an impossible day over into the next month; such text is not a date.
  const isSameDay =
    result.getFullYear() === year &&
    result.getMonth() === parts.month - 1 &&
    result.getDate() === parts.day
  return isSameDay ? result : undefined
}
