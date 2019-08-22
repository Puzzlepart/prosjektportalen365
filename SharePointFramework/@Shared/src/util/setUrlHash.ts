/**
 * Set URL hash
 *
 * @param {T} hashObject Hash object
 */
export default function setUrlHash<T>(hashObject: T): void {
    let hash = "#";
    let hashParts = Object.keys(hashObject).map(key => `${key}=${hashObject[key]}`);
    hash += hashParts.join("&");
    document.location.hash = hash;
}