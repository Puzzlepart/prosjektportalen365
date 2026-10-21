import { getNewEntityProperties } from './newEntityProperties'

/** The project's properties item, as `ItemFieldValues.get` reads its text values. */
function fieldValues(textValues: Record<string, string>) {
  return {
    get: (fieldName: string) => textValues[fieldName] ?? null
  } as any
}

describe('getNewEntityProperties', () => {
  it('gives a new hub entity the group, the content type and what the setup records', () => {
    expect(
      getNewEntityProperties(
        'group-1',
        fieldValues({
          GtProjectTemplate: 'Standardmal',
          GtInstalledVersion: '1.15.0',
          GtProjectExtensions: 'Gevinstoppfølging',
          GtProjectListContent: 'Planneroppgaver',
          GtProjectFinanceName: 'Ikke med'
        }),
        '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C01'
      )
    ).toEqual({
      GtGroupId: 'group-1',
      ContentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C01',
      GtProjectTemplate: 'Standardmal',
      GtInstalledVersion: '1.15.0',
      GtProjectExtensions: 'Gevinstoppfølging',
      GtProjectListContent: 'Planneroppgaver'
    })
  })

  it('leaves out what the project does not have', () => {
    expect(
      getNewEntityProperties(undefined, fieldValues({ GtProjectTemplate: '' }), undefined)
    ).toEqual({})
  })
})
