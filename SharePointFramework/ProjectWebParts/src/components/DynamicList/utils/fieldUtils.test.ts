import { isVisibleListField, normalizeViewFieldNames } from './fieldUtils'

/**
 * Which SharePoint fields a dynamic list may show: view aliases resolved to field names, and
 * read-only or hidden fields left out unless the hub's column configuration names them.
 */
describe('fieldUtils', () => {
  it('resolves the view aliases to field names', () => {
    expect(
      normalizeViewFieldNames(['LinkTitle', 'LinkFilenameNoMenu', 'DocIcon', 'GtOwner'])
    ).toEqual(['Title', 'FileLeafRef', 'File_x0020_Type', 'GtOwner'])
  })

  it('shows editable fields and hides read-only ones unless they are configured columns', () => {
    const field = (InternalName: string, extra: Record<string, any> = {}) => ({
      InternalName,
      Title: InternalName,
      Hidden: false,
      ...extra
    })
    expect(isVisibleListField(field('Title'), [])).toBe(true)
    expect(isVisibleListField(field('Attachments'), [])).toBe(false)
    expect(isVisibleListField(field('GtHidden', { ShowInEditForm: false }), [])).toBe(false)
    const readOnly = field('GtCalc', { SchemaXml: '<Field ReadOnly="TRUE" />' })
    expect(isVisibleListField(readOnly, [])).toBe(false)
    expect(isVisibleListField(readOnly, [{ internalName: 'GtCalc' }])).toBe(true)
  })
})
