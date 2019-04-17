import getObjectValue from "./getObjectValue";


/**
 * Sort alphabetically
 * 
 * @param {T} a Object a
 * @param {T} b Object b
 * @param {boolean} ascending Sort ascending
 * @param {string} property Property
 */
export default function sortAlphabetically<T>(a: T, b: T, ascending?: boolean, property?: string): number {
    let aValue = getObjectValue(a, property, '') || a;
    let bValue = getObjectValue(b, property, '') || b;
    if (aValue < bValue) { return ascending ? -1 : 1; }
    if (aValue > bValue) { return ascending ? 1 : -1; }
    return 0;
}