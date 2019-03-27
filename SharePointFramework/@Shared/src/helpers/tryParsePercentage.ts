import tryParseFloat from './tryParseFloat';

/**
 * 
 * @param {string} str The string to parse
 * @param {boolean} addPostfix Add postix (%)
 * @param {string | number} fallback Fallback if parse fails
 */
export default (str: string, addPostfix: boolean = true, fallback: string | number): number | string => {
    var parsed = tryParseFloat(str, fallback);
    if (parsed === fallback) {
        return fallback;
    }
    let percentage = (parsed as number) * 100;
    return addPostfix ? `${percentage}%` : percentage;
};