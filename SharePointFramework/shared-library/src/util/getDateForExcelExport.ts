/**
 * Returns a value suitable for Excel export from a date field in SharePoint.
 *
 * - If `includeTime` is true, returns a JavaScript Date object (date and time).
 * - If `includeTime` is false, returns an ISO date string (`YYYY-MM-DD`) with no time component.
 * - If the value is missing or invalid, returns an empty string.
 *
 * @param value - The date value as a string or Date object.
 * @param includeTime - Whether to include the time component (default: false).
 * @returns {Date | string} Date object (with time) or ISO date string (without time), or empty string if invalid.
 */
export function getDateForExcelExport(
  value: string | Date | undefined,
  includeTime: boolean = false
): Date | string {
  if (!value) return ''
  const date = value instanceof Date ? new Date(value) : new Date(value)
  if (isNaN(date.getTime())) return ''
  return includeTime ? date : date.toISOString().slice(0, 10)
}
