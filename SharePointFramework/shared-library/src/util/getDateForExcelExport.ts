import { toSiteWallTime } from './siteTimeZone'

/**
 * Returns the text an Excel export writes for a date field in SharePoint, as the list shows it:
 * in the site's time zone where the page gave one (`toSiteWallTime`), else the browser's.
 *
 * - Without `includeTime`: the date, `YYYY-MM-DD`.
 * - With `includeTime`: the date and the time, `YYYY-MM-DD HH:mm`.
 * - A missing or invalid value: an empty string.
 *
 * SharePoint sends a date-only value as the moment of the site's midnight in UTC, which east of
 * UTC is on the day before; reading the date in UTC would export that day, and reading it in the
 * browser's time zone exported the day before on a machine west of the site.
 *
 * @param value - The date value as a string or Date object.
 * @param includeTime - Whether to include the time (default: false).
 */
export function getDateForExcelExport(
  value: string | Date | undefined,
  includeTime: boolean = false
): string {
  if (!value) return ''
  const date = toSiteWallTime(new Date(value))
  if (isNaN(date.getTime())) return ''
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return includeTime ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}` : day
}
