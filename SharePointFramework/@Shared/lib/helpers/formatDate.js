var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
/**
 * Format date
 *
 * @param {string} dateStr Date string
 * @param {string} fallback Fallback if date is invalid
 * @param {string} locale Locale
 */
export default function formatDate(dateStr, includeTime, fallback, locale) {
    if (includeTime === void 0) { includeTime = false; }
    if (fallback === void 0) { fallback = ''; }
    if (locale === void 0) { locale = 'nb-NO'; }
    var options = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };
    if (includeTime) {
        options = __assign({}, options, { hour: '2-digit', minute: '2-digit' });
    }
    return dateStr ?
        new Date(dateStr).toLocaleString(locale, options)
        : fallback;
}
;
//# sourceMappingURL=formatDate.js.map