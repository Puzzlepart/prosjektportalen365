import { TELEMETRY_PATTERNS } from './contract'
import { normalizeGuid } from './validate'

/** How many hex characters of the digest make up the site hash. */
const SITE_HASH_LENGTH = 16

/**
 * The year and month in Oslo (`YYYY-MM`), which is where Assist's month turns over. `undefined`
 * where the browser has no time zone data.
 *
 * @param now The time
 */
export function osloYearMonth(now: Date): string | undefined {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Oslo',
      year: 'numeric',
      month: '2-digit'
    }).formatToParts(now)
    const part = (type: string) => parts.filter((candidate) => candidate.type === type)[0].value
    return `${part('year')}-${part('month')}`
  } catch {
    return undefined
  }
}

/**
 * The site hash of level 2 and up: the first 16 hex characters of SHA-256 of
 * `pp365-site|<YYYY-MM in Europe/Oslo>|<site id, lowercase, no braces>`. The month makes the hash
 * change every month, so a site cannot be followed from one month to the next, and the site id
 * itself never leaves the tenant. Resolves to `undefined` without `crypto.subtle`, a time zone or a
 * valid site id: the site is then left out of `sites`.
 *
 * @param siteId The site's id
 * @param now The time, which gives the month
 */
export function computeSiteHash(siteId: string, now: Date): Promise<string | undefined> {
  try {
    const subtle = typeof crypto === 'undefined' ? undefined : crypto.subtle
    const id = normalizeGuid(siteId)
    const month = osloYearMonth(now)
    if (!subtle || !id || !month) return Promise.resolve(undefined)
    const text = `pp365-site|${month}|${id}`
    // The text is ASCII (a month and a GUID), so its bytes are its character codes.
    const bytes = new Uint8Array(text.length)
    for (let index = 0; index < text.length; index++) bytes[index] = text.charCodeAt(index)
    return Promise.resolve(subtle.digest('SHA-256', bytes)).then(
      (digest) => {
        const hash = toHex(new Uint8Array(digest)).substring(0, SITE_HASH_LENGTH)
        return TELEMETRY_PATTERNS.siteHash.test(hash) ? hash : undefined
      },
      () => undefined
    )
  } catch {
    return Promise.resolve(undefined)
  }
}

/** The bytes as lowercase hex. */
function toHex(bytes: Uint8Array): string {
  let hex = ''
  for (let index = 0; index < bytes.length; index++) {
    hex += (bytes[index] < 16 ? '0' : '') + bytes[index].toString(16)
  }
  return hex
}
