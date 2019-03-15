export default (str: string, fallback: string): number | string => {
    var parsed = parseInt(str, 10);
    return !isNaN(parsed) ? parsed : fallback;
};
