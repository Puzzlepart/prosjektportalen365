/**
 * Set URL hash
 *
 * @param {Object} hashObject Hash object
 */
export default function setUrlHash(hashObject) {
    var hash = "#";
    var hashParts = Object.keys(hashObject).map(function (key) { return key + "=" + hashObject[key]; });
    hash += hashParts.join("&");
    document.location.hash = hash;
}
//# sourceMappingURL=setUrlHash.js.map