/**
 * Format date
 * 
 * @param {string} dateStr Date string
 * @param {string} fallback Fallback if date is invalid
 * @param {string} locale Locale
 */
export default function formatDate(dateStr: string, includeTime: boolean = false, fallback: string = '', locale: string = 'nb-NO'): string {
    let options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };
    if (includeTime) {
        options = {
            ...options,
            hour: '2-digit',
            minute: '2-digit',
        }
    }
    return dateStr ?
        new Date(dateStr).toLocaleString(locale, options)
        : fallback;
};