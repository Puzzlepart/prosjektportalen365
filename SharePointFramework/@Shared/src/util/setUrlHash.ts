/**
 * Set URL hash
 *
 * @param {Object} hashObject Hash object
 */
export default function setUrlHash(hashObject: { [key: string]: string }): void {
    let hash = "#";
    let hashParts = Object.keys(hashObject).map(key => `${key}=${hashObject[key]}`);
    hash += hashParts.join("&");
    document.location.hash = hash;
}