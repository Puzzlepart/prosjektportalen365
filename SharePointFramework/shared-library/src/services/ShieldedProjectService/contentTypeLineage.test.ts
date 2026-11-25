import {
  getContentTypeLineage,
  isBuiltOnContentType,
  isListContentTypeOf
} from './contentTypeLineage'

const PROJECT = '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C'
const STATUS = '0x010022252E35737A413FB56A1BA53862F6D5'
const GUID = 'A1B2C3D4E5F60718293A4B5C6D7E8F90'

describe('getContentTypeLineage', () => {
  it('gives a custom content type built on Item', () => {
    expect(getContentTypeLineage(PROJECT)).toEqual([PROJECT])
    expect(getContentTypeLineage(STATUS)).toEqual([STATUS])
  })

  it("gives a template's content type after the one it is built on", () => {
    const template = `${PROJECT}00A1B2C3D4E5F60718293A4B5C6D7E8F90`
    expect(getContentTypeLineage(template)).toEqual([PROJECT, template])
  })

  it('leaves out the built-in content types every site has', () => {
    const document = '0x0101'
    const custom = `${document}00A1B2C3D4E5F60718293A4B5C6D7E8F90`
    expect(getContentTypeLineage(document)).toEqual([])
    expect(getContentTypeLineage(custom)).toEqual([custom])
  })

  it('gives nothing for a value that is not a content type ID', () => {
    expect(getContentTypeLineage('')).toEqual([])
    expect(getContentTypeLineage(undefined)).toEqual([])
    expect(getContentTypeLineage('Prosjektstatus')).toEqual([])
  })
})

describe('isListContentTypeOf', () => {
  it("knows a list's own copy of a content type, in any case", () => {
    expect(isListContentTypeOf(`${STATUS}00${GUID}`, STATUS)).toBe(true)
    expect(isListContentTypeOf(`${STATUS}00${GUID}`.toLowerCase(), STATUS)).toBe(true)
  })

  it('is not the content type itself, another content type, or a copy of one built on it', () => {
    expect(isListContentTypeOf(STATUS, STATUS)).toBe(false)
    expect(isListContentTypeOf(`${PROJECT}00${GUID}`, STATUS)).toBe(false)
    expect(isListContentTypeOf(`${STATUS}00${GUID}00${GUID}`, STATUS)).toBe(false)
    // A folder, which a list may keep beside its items' content type.
    expect(isListContentTypeOf(`0x012000${GUID}`, STATUS)).toBe(false)
  })

  it('is never a copy of nothing', () => {
    expect(isListContentTypeOf(`00${GUID}`, '')).toBe(false)
    expect(isListContentTypeOf(undefined, undefined)).toBe(false)
  })
})

describe('isBuiltOnContentType', () => {
  it('knows a content type built on another, directly or through others', () => {
    expect(isBuiltOnContentType(`${STATUS}00${GUID}`, STATUS)).toBe(true)
    expect(isBuiltOnContentType(`${STATUS}00${GUID}00${GUID}`.toLowerCase(), STATUS)).toBe(true)
  })

  it('is not built on itself, on another content type, or on nothing', () => {
    expect(isBuiltOnContentType(STATUS, STATUS)).toBe(false)
    expect(isBuiltOnContentType(`${PROJECT}00${GUID}`, STATUS)).toBe(false)
    expect(isBuiltOnContentType(STATUS, '')).toBe(false)
    expect(isBuiltOnContentType(undefined, STATUS)).toBe(false)
  })
})
