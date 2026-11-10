import { getContentTypeLineage } from './contentTypeLineage'

const PROJECT = '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C'
const STATUS = '0x010022252E35737A413FB56A1BA53862F6D5'

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
