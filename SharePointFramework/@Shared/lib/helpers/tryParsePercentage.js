import tryParseFloat from './tryParseFloat';
/**
 *
 * @param {string} str The string to parse
 * @param {boolean} addPostfix Add postix (%)
 * @param {string | number} fallback Fallback if parse fails
 */
export default function (str, addPostfix, fallback) {
    if (addPostfix === void 0) { addPostfix = true; }
    var parsed = tryParseFloat(str, fallback);
    if (parsed === fallback) {
        return fallback;
    }
    var percentage = parsed * 100;
    return addPostfix ? percentage + "%" : percentage;
};
//# sourceMappingURL=tryParsePercentage.js.map