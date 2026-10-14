import { getRegionalLocale, getUILocale } from './getUILocale'
import { toSiteWallTime } from './siteTimeZone'

/** Hours and minutes, added to either form when the time is asked for. */
const TIME: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

/** The date as numbers: "18.11.2022" in Norwegian, "11/18/2022" in American English. */
const SHORT_DATE: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }

/**
 * Formats a date in the long form with the weekday ("fredag 18. nov. 2022"), in SharePoint's UI
 * language unless `locale` is given, and in the site's time zone where the page gave one
 * (`toSiteWallTime`): the day and the time SharePoint's own lists show. A date-only value is
 * stored as midnight in the site's time zone, which read in the machine's zone was the day before
 * on a machine west of the site (London, New York).
 *
 * @param date Date string or object, an instant
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
  const value = toSiteWallTime(typeof date === 'string' ? new Date(date) : date)
  return value.toLocaleString(locale, options)
}

/**
 * Formats a date as numbers ("18.11.2022", "11/18/2022" in American English), in SharePoint's UI
 * language unless `locale` is given, in the site's time zone where the page gave one, as
 * `formatDate`. For field values, where `formatDate`'s weekday is noise. A date picker's value is
 * a day, not an instant: `formatDay` writes it.
 *
 * @param date Date string or object, an instant
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
  return toSiteWallTime(value).toLocaleString(
    locale,
    includeTime ? { ...SHORT_DATE, ...TIME } : SHORT_DATE
  )
}

/**
 * Formats the day a local `Date` holds as numbers ("18.11.2022"): a date picker's value, the day
 * `readStoredDay` and `parseShortDate` give, at local midnight. A day is not an instant, so it is
 * never moved to the site's time zone as `formatShortDate` moves one: moved, a day picked on a
 * machine east of the site (Helsinki, Tokyo) would read as the day before. The date picker's
 * `formatDate`, with `parseShortDate` as its parser.
 *
 * @param date The day, at local midnight
 * @param locale Locale, by default SharePoint's UI language (`getUILocale`)
 *
 * @returns the day as numbers, or an empty string for no day or what is not a date
 */
export function formatDay(date: Date | undefined, locale: string = getUILocale()): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return ''
  return date.toLocaleString(locale, SHORT_DATE)
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

/**
 * The day a date picker picked, as `YYYY-MM-DD`, which SharePoint reads as midnight in the site's
 * time zone, as its own forms store a date. Sent as an instant instead (the picker's local
 * midnight, in UTC), the day became the day before for a machine east of the site's time zone:
 * "03.04.2026" typed in Helsinki or Tokyo was stored as 2 April on an Oslo site.
 *
 * @param date The picked date
 *
 * @returns the day, or `null` for no date
 */
// SharePoint clears a field with null, so null is what no date is sent as.
// eslint-disable-next-line @rushstack/no-new-null
export function toCalendarDate(date: Date | null | undefined): string | null {
  if (!(date instanceof Date) || isNaN(date.getTime())) return null
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** How far the text's day may lie from the stored instant: time zones differ by up to 26 hours. */
const NEAR_INSTANT = 36 * 60 * 60 * 1000

/**
 * The day a stored date is in SharePoint, as a date at local midnight for a date picker. A date
 * is stored as an instant, midnight in the site's time zone; read as that instant in the machine's
 * time zone, a machine west of the site (London, New York) got the day before. SharePoint's text
 * of the value (`FieldValuesAsText`) is written in the site's time zone and regional format, so
 * the day is read from it. The text is trusted only near the instant: a format guessed wrong swaps
 * day and month, which moves the date by weeks, and then the instant is kept.
 *
 * @param stored The stored value, an ISO date
 * @param text SharePoint's text of the value
 * @param locale The regional format the text is in, by default the site's (`getRegionalLocale`)
 *
 * @returns the day, the instant when the text is not a date near it, or `undefined` for no value
 */
export function readStoredDay(
  stored: string | undefined,
  text: string | undefined,
  locale: string = getRegionalLocale()
): Date | undefined {
  const instant = stored ? new Date(stored) : undefined
  const day = text ? parseShortDate(text, locale) : undefined
  if (!instant || isNaN(instant.getTime())) return day
  return day && Math.abs(day.getTime() - instant.getTime()) < NEAR_INSTANT ? day : instant
}
