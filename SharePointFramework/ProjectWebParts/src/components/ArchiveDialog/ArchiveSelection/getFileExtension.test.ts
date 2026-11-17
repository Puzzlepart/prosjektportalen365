import { getFileExtension } from './getFileExtension'

/**
 * The file type icon of a document in the archive's selection is looked up by its extension: a
 * whole file name finds no icon, and every document showed the generic one.
 */
describe('getFileExtension', () => {
  it('takes what follows the last dot, in lower case', () => {
    expect(getFileExtension('Prosjektplan.docx')).toBe('docx')
    expect(getFileExtension('Budsjett 2026.v2.XLSX')).toBe('xlsx')
  })

  it('gives nothing for a name without an extension, or one that only starts with a dot', () => {
    expect(getFileExtension('Referat')).toBe('')
    expect(getFileExtension('.gitignore')).toBe('')
    expect(getFileExtension('')).toBe('')
    expect(getFileExtension(undefined)).toBe('')
  })
})
