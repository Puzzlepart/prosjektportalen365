import tryParseFloat from './tryParseFloat';

export default (str: string, fallback: string): number | string => {
    var parsed = tryParseFloat(str, fallback);
    if (parsed === fallback) {
        return fallback;
    }
    return `${((parsed as number) * 100)}%`;
};