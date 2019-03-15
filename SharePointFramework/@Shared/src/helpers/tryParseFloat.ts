export default (str: string, fallback: string): number | string => {
    var parsed = parseFloat(str);
    return !isNaN(parsed) ? parsed : fallback;
};