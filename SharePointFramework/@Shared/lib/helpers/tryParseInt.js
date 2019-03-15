export default function (str, fallback) {
    var parsed = parseInt(str, 10);
    return !isNaN(parsed) ? parsed : fallback;
};
//# sourceMappingURL=tryParseInt.js.map