import tryParseFloat from './tryParseFloat';
export default function (str, fallback) {
    var parsed = tryParseFloat(str, fallback);
    if (parsed === fallback) {
        return fallback;
    }
    return (parsed * 100) + "%";
};
//# sourceMappingURL=tryParsePercentage.js.map