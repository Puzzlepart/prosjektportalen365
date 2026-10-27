import { getNewEntityProperties } from './newEntityProperties'

/**
 * The project's properties item, as `ItemFieldValues.get` reads it: the text value with
 * `format: 'text'`, the raw value in an object without a format.
 */
function fieldValues(values: Record<string, string | boolean>) {
  return {
    get: (fieldName: string, options: { format?: string } = {}) => {
      if (!(fieldName in values)) return null
      const value = values[fieldName]
      if (options.format === 'text') return value ? String(value) : null
      return { value, valueAsText: String(value) }
    }
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
          GtCurrentVersion: '1.15.0',
          GtProjectExtensions: 'Gevinstoppfølging',
          GtProjectListContent: 'Planneroppgaver',
          GtIsProgram: false,
          GtIsParentProject: true,
          GtProjectFinanceName: 'Ikke med'
        }),
        '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C01'
      )
    ).toEqual({
      GtGroupId: 'group-1',
      ContentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C01',
      GtProjectTemplate: 'Standardmal',
      GtInstalledVersion: '1.15.0',
      GtCurrentVersion: '1.15.0',
      GtProjectExtensions: 'Gevinstoppfølging',
      GtProjectListContent: 'Planneroppgaver',
      GtIsProgram: false,
      GtIsParentProject: true
    })
  })

  it('keeps a program a program', () => {
    expect(
      getNewEntityProperties('group-1', fieldValues({ GtIsProgram: true }), undefined)
    ).toMatchObject({ GtIsProgram: true })
  })

  it('leaves out what the project does not have', () => {
    expect(
      getNewEntityProperties(undefined, fieldValues({ GtProjectTemplate: '' }), undefined)
    ).toEqual({})
  })
})
