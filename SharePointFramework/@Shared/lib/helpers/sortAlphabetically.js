import getObjectValue from "./getObjectValue";
/**
 * Sort alphabetically
 *
 * @param {T} a Object a
 * @param {T} b Object b
 * @param {boolean} ascending Sort ascending
 * @param {string} property Property
 */
export default function sortAlphabetically(a, b, ascending, property) {
    var aValue = getObjectValue(a, property, '') || a;
    var bValue = getObjectValue(b, property, '') || b;
    if (aValue < bValue) {
        return ascending ? -1 : 1;
    }
    if (aValue > bValue) {
        return ascending ? 1 : -1;
    }
    return 0;
}
//# sourceMappingURL=sortAlphabetically.js.map