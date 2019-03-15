import tryParseInt from "./tryParseInt";

export default (str: string, fallback: string): number | string => {
    var parsed = tryParseInt(str, fallback);
    if (parsed === fallback) {
        return fallback;
    }
    return `kr ${parsed as number}`;
};
