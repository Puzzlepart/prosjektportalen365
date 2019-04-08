/**
 * Format date
 * 
 * @param {string} dateStr Date string
 * @param {string} fallback Fallback if date is invalid
 */
export default (dateStr: string, fallback: string = ''): string => {
    return dateStr ?
        new Date(dateStr).toLocaleString("nb-NO", {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : fallback;
};