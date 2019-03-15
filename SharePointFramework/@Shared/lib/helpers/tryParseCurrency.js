import tryParseInt from "./tryParseInt";
export default function (str, fallback) {
    var parsed = tryParseInt(str, fallback);
    if (parsed === fallback) {
        return fallback;
    }
    return "kr " + parsed;
};
//# sourceMappingURL=tryParseCurrency.js.map