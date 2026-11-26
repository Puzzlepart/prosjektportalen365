import { getProjectPropertiesListSettings } from './projectPropertiesList'

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
