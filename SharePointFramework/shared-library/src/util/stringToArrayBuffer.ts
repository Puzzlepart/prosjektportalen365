/**
 * Converts string to array buffer
 *
 * @param str String
 */
export function stringToArrayBuffer(str: string) {
  const buf = new ArrayBuffer(str.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i !== str.length; ++i) {
    view[i] = str.charCodeAt(i) & 0xff
  }
  return buf
}
