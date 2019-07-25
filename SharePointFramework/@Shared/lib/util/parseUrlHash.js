/**
 * Parse url hash
 */
export default function parseUrlHash() {
    var hash = document.location.hash.substring(1);
    return hash.split("&").reduce(function (obj, str) {
        var _a = str.split("="), key = _a[0], value = _a[1];
        if (key && value) {
            obj[key] = value;
        }
        return obj;
    }, {});
}
//# sourceMappingURL=parseUrlHash.js.map