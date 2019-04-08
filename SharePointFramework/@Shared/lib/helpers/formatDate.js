/**
 * Format date
 *
 * @param {string} dateStr Date string
 * @param {string} fallback Fallback if date is invalid
 */
export default function (dateStr, fallback) {
    if (fallback === void 0) { fallback = ''; }
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
//# sourceMappingURL=formatDate.js.map