import {
  isSameTermGuid,
  joinSegments,
  normalizeTermGuid,
  termIdSegment,
  termSegments,
  termSetSegments,
  TERM_SETS_PATH,
  TERM_STORE_API_PATH,
  TERMS_PATH
} from './paths'

const TERM_SET_ID = '9c69b57f-1a1b-4d1c-9a2e-2d9a0d7a0001'
const TERM_ID = 'aaaa1111-0000-0000-0000-000000000001'

describe('normalizeTermGuid', () => {
  it('returns a bare GUID untouched', () => {
    expect(normalizeTermGuid(TERM_SET_ID)).toBe(TERM_SET_ID)
  })

  it('strips the braces provisioning templates wrap IDs in', () => {
    expect(normalizeTermGuid(`{${TERM_SET_ID}}`)).toBe(TERM_SET_ID)
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeTermGuid(`  ${TERM_SET_ID}\n`)).toBe(TERM_SET_ID)
  })

  it('returns an empty string for anything unusable', () => {
    expect(normalizeTermGuid('')).toBe('')
    expect(normalizeTermGuid('   ')).toBe('')
    expect(normalizeTermGuid(null)).toBe('')
    expect(normalizeTermGuid(undefined)).toBe('')
    expect(normalizeTermGuid(42 as any)).toBe('')
  })
})

describe('isSameTermGuid', () => {
  it('ignores casing, which the term store is not consistent about', () => {
    expect(isSameTermGuid(TERM_SET_ID, TERM_SET_ID.toUpperCase())).toBe(true)
  })

  it('ignores braces', () => {
    expect(isSameTermGuid(`{${TERM_SET_ID}}`, TERM_SET_ID)).toBe(true)
  })

  it('does not treat two missing IDs as equal', () => {
    expect(isSameTermGuid('', '')).toBe(false)
    expect(isSameTermGuid(undefined, undefined)).toBe(false)
  })

  it('separates different IDs', () => {
    expect(isSameTermGuid(TERM_SET_ID, '9c69b57f-1a1b-4d1c-9a2e-2d9a0d7a0002')).toBe(false)
  })
})

describe('termIdSegment', () => {
  it('produces the bare GUID for a well formed ID', () => {
    expect(termIdSegment(`{${TERM_SET_ID}}`)).toBe(TERM_SET_ID)
  })

  it('escapes anything that is not a bare GUID rather than letting it reshape the URL', () => {
    expect(termIdSegment('a/b?$top=1')).toBe('a%2Fb%3F%24top%3D1')
  })

  it('throws on a missing ID instead of requesting an invalid URL', () => {
    expect(() => termIdSegment('')).toThrow(/Invalid term store ID/)
    expect(() => termIdSegment(undefined)).toThrow(/Invalid term store ID/)
    expect(() => termIdSegment('{}')).toThrow(/Invalid term store ID/)
  })
})

describe('path segments', () => {
  it('addresses a term set below the term store root', () => {
    expect(termSetSegments(TERM_SET_ID)).toEqual([TERM_SETS_PATH, TERM_SET_ID])
  })

  it('addresses a term below a term set', () => {
    expect(termSegments(TERM_SET_ID)).toEqual([TERMS_PATH, TERM_SET_ID])
  })

  it('pins the SharePoint term store API path, which is what keeps localProperties available', () => {
    expect(TERM_STORE_API_PATH).toBe('_api/v2.1/termstore')
  })
})

describe('joinSegments', () => {
  it('builds the relative path a term set queryable is chained on', () => {
    expect(joinSegments(termSetSegments(`{${TERM_SET_ID}}`))).toBe(`sets/${TERM_SET_ID}`)
  })

  it('builds the relative path a term queryable is chained on', () => {
    expect(joinSegments(termSegments(TERM_ID))).toBe(`terms/${TERM_ID}`)
  })

  it('assembles the full term store URL shape the REST surface expects', () => {
    expect(
      joinSegments([TERM_STORE_API_PATH, ...termSetSegments(TERM_SET_ID), ...termSegments(TERM_ID)])
    ).toBe(`_api/v2.1/termstore/sets/${TERM_SET_ID}/terms/${TERM_ID}`)
  })

  it('drops empty segments rather than emitting the double slash the term store rejects', () => {
    expect(joinSegments([TERMS_PATH, '', TERM_ID])).toBe(`terms/${TERM_ID}`)
    expect(joinSegments(undefined)).toBe('')
  })
})
