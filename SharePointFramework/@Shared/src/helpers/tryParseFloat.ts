export default (str: string, fallback: string | number): number | string => {
    var parsed = parseFloat(str);
    return !isNaN(parsed) ? parsed : fallback;
};