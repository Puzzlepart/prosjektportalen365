/**
 * Parse url hash
 */
export default function parseUrlHash(): { [key: string]: string } {
    var pieces = document.location.hash.split("&"), data = {}, i, parts;
    for (i = 0; i < pieces.length; i++) {
        parts = pieces[i].split("=");
        if (parts.length < 2) {
            parts.push("");
        }
        data[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    }
    return data;
}