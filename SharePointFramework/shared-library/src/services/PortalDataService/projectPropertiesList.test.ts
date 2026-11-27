import { findSiteColumn, getProjectPropertiesListSettings } from './projectPropertiesList'

describe('findSiteColumn', () => {
  const siteFields = [
    { InternalName: 'GtProjectPhase', SchemaXml: '<Field Name="GtProjectPhase" />' },
    { InternalName: 'GtSiteId', SchemaXml: '<Field Name="GtSiteId" ShowInEditForm="FALSE" />' },
    { InternalName: 'GtGroupId' }
  ]

  it("finds the project site's column of that name, and passes over one hidden from the edit form", () => {
    expect(findSiteColumn(siteFields, 'GtProjectPhase', false)).toBe(siteFields[0])
    expect(findSiteColumn(siteFields, 'GtSiteId', false)).toBeUndefined()
    // A site column read without its schema is not known to be hidden.
    expect(findSiteColumn(siteFields, 'GtGroupId', false)).toBe(siteFields[2])
  })

  it('takes a column hidden from the edit form too when every field is to come from a site column, as for a shielded project', () => {
    expect(findSiteColumn(siteFields, 'GtSiteId', true)).toBe(siteFields[1])
    expect(findSiteColumn(siteFields, 'GtProjectPhase', true)).toBe(siteFields[0])
  })

  it('finds nothing for a field the site has no column for, or without site columns', () => {
    expect(findSiteColumn(siteFields, 'GtProjectNumber', true)).toBeUndefined()
    expect(findSiteColumn([], 'GtSiteId', true)).toBeUndefined()
    expect(findSiteColumn(undefined, 'GtSiteId', false)).toBeUndefined()
  })
})

describe('getProjectPropertiesListSettings', () => {
  it("keeps the list hidden, with its template's content type, for a project the portfolio shows by its entry in the hub", () => {
    expect(getProjectPropertiesListSettings(false)).toEqual({
      enableContentTypes: false,
      settings: { Hidden: true, EnableAttachments: false, EnableVersioning: true }
    })
  })

  it('keeps the list of a shielded project visible, with its content types: the portfolio finds the item by search, which leaves hidden lists out', () => {
    expect(getProjectPropertiesListSettings(true)).toEqual({
      enableContentTypes: true,
      settings: { Hidden: false, EnableAttachments: false, EnableVersioning: true }
    })
  })
})
