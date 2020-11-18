/**
 * Format date
 *
 * @param {string | Date} date Date string or object
 * @param {string} fallback Fallback if date is invalid
 * @param {string} locale Locale
 */
export function formatDate(
  date: string | Date,
  includeTime: boolean = false,
  fallback: string = '',
  locale: string = 'nb-NO'
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
      hour: '2-digit',
      minute: '2-digit'
    }
  }
  if (!date) return fallback
  return (typeof date === 'string' ? new Date(date) : date).toLocaleString(locale, options)
}
