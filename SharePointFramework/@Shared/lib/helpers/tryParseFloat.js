export default function (str, fallback) {
    var parsed = parseFloat(str);
    return !isNaN(parsed) ? parsed : fallback;
};
//# sourceMappingURL=tryParseFloat.js.map