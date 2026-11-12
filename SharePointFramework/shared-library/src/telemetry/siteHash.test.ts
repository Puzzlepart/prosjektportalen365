import { createHash } from 'crypto'
import { computeSiteHash, osloYearMonth } from './siteHash'
import {
  ITelemetryTestBed,
  PROJECT_SITE_ID,
  sha256,
  telemetryTestBed
} from './__fixtures__/testFixtures'

const NOVEMBER = new Date('2026-11-12T09:00:00Z')

/**
 * The site hash is the only value tied to a site that leaves the tenant. It must not be the site
 * id, and it must change with the month in Oslo, so that a site cannot be followed over time.
 */
describe('computeSiteHash', () => {
  let bed: ITelemetryTestBed
  const digested: string[] = []

  beforeEach(() => {
    bed = telemetryTestBed()
    digested.length = 0
    bed.stubCrypto({
      digest: (text) => {
        digested.push(text)
        return sha256(text)
      }
    })
  })

  afterEach(() => bed.restore())

  it('is the first 16 hex characters of SHA-256 of the prefix, the Oslo month and the site id', async () => {
    const hash = await computeSiteHash(PROJECT_SITE_ID, NOVEMBER)
    expect(hash).toMatch(/^[0-9a-f]{16}$/)
    expect(digested).toEqual([`pp365-site|2026-11|${PROJECT_SITE_ID}`])
    const expected = createHash('sha256')
      .update(`pp365-site|2026-11|${PROJECT_SITE_ID}`)
      .digest('hex')
      .substring(0, 16)
    expect(hash).toBe(expected)
  })

  it('is never the site id, nor a part of it', async () => {
    const hash = await computeSiteHash(PROJECT_SITE_ID, NOVEMBER)
    const id = PROJECT_SITE_ID.replace(/-/g, '')
    expect(id).not.toContain(hash)
    expect(hash).not.toContain(id.substring(0, 8))
  })

  it('is the same for the site id in any of its spellings', async () => {
    const hash = await computeSiteHash(PROJECT_SITE_ID, NOVEMBER)
    expect(await computeSiteHash(`{${PROJECT_SITE_ID.toUpperCase()}}`, NOVEMBER)).toBe(hash)
    expect(await computeSiteHash(` ${PROJECT_SITE_ID} `, NOVEMBER)).toBe(hash)
  })

  it('is the same all through one month in Oslo, and another the next month', async () => {
    // Midnight on 1 November and one second before midnight on 30 November, Oslo time (UTC+1).
    const first = await computeSiteHash(PROJECT_SITE_ID, new Date('2026-10-31T23:00:00Z'))
    const last = await computeSiteHash(PROJECT_SITE_ID, new Date('2026-11-30T22:59:59Z'))
    const next = await computeSiteHash(PROJECT_SITE_ID, new Date('2026-11-30T23:00:00Z'))
    expect(last).toBe(first)
    expect(next).toMatch(/^[0-9a-f]{16}$/)
    expect(next).not.toBe(first)
    expect(digested[2]).toBe(`pp365-site|2026-12|${PROJECT_SITE_ID}`)
  })

  it('differs from site to site', async () => {
    const other = `0${PROJECT_SITE_ID.substring(1)}`
    expect(await computeSiteHash(other, NOVEMBER)).not.toBe(
      await computeSiteHash(PROJECT_SITE_ID, NOVEMBER)
    )
  })

  it('gives nothing without crypto.subtle', async () => {
    bed.removeSubtleCrypto()
    expect(await computeSiteHash(PROJECT_SITE_ID, NOVEMBER)).toBeUndefined()
    delete (globalThis as any).crypto
    expect(await computeSiteHash(PROJECT_SITE_ID, NOVEMBER)).toBeUndefined()
    expect(digested).toEqual([])
  })

  it('gives nothing for a value that is no site id, or a time that is none', async () => {
    expect(await computeSiteHash('prosjekt-a', NOVEMBER)).toBeUndefined()
    expect(await computeSiteHash('', NOVEMBER)).toBeUndefined()
    expect(await computeSiteHash(undefined, NOVEMBER)).toBeUndefined()
    expect(await computeSiteHash(PROJECT_SITE_ID, new Date(NaN))).toBeUndefined()
    expect(digested).toEqual([])
  })

  it('gives nothing when the digest fails or is too short', async () => {
    bed.stubCrypto({
      digest: () => {
        throw new Error('The operation failed')
      }
    })
    expect(await computeSiteHash(PROJECT_SITE_ID, NOVEMBER)).toBeUndefined()
    bed.stubCrypto({ digest: () => [1, 2, 3] })
    expect(await computeSiteHash(PROJECT_SITE_ID, NOVEMBER)).toBeUndefined()
  })
})

describe('osloYearMonth', () => {
  it('turns over at midnight in Oslo, in winter and in summer time', () => {
    expect(osloYearMonth(new Date('2026-12-31T22:59:59Z'))).toBe('2026-12')
    expect(osloYearMonth(new Date('2026-12-31T23:00:00Z'))).toBe('2027-01')
    expect(osloYearMonth(new Date('2026-06-30T21:59:59Z'))).toBe('2026-06')
    expect(osloYearMonth(new Date('2026-06-30T22:00:00Z'))).toBe('2026-07')
  })

  it('gives nothing for a time that is none', () => {
    expect(osloYearMonth(new Date(NaN))).toBeUndefined()
  })
})
