/**
 * Parse url hash
 */
export default function parseUrlHash(): { [key: string]: string } {
    let hash = document.location.hash.substring(1);
    return hash.split("&").reduce((obj, str) => {
        let [key, value] = str.split("=");
        if (key && value) {
            obj[key] = value;
        }
        return obj;
    }, {});
}