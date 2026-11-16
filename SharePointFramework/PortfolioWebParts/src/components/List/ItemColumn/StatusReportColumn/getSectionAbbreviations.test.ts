import { getSectionAbbreviations } from './getSectionAbbreviations'

/**
 * The legend above the status report strips: two letters for each section, each different from
 * the others, so a column of tiles can be followed down the rows by its section.
 */
describe('getSectionAbbreviations', () => {
  it("takes the first two letters of each of the hub template's sections", () => {
    const names = [
      'Fremdrift',
      'Økonomi',
      'Kvalitet',
      'Risiko',
      'Nytteoppnåelse',
      'Muligheter',
      'Omfang',
      'Bærekraft'
    ]
    expect(getSectionAbbreviations(names).join(' ')).toBe('Fr Øk Kv Ri Ny Mu Om Bæ')
  })

  it('writes the first letter in upper case and the second as written', () => {
    expect(getSectionAbbreviations(['økonomi', 'eTjenester'])).toEqual(['Øk', 'ET'])
  })

  it('tells two sections apart by the first later letter that no earlier one has', () => {
    const names = ['Fremdrift', 'Fremtid', 'Fremmed']
    expect(getSectionAbbreviations(names)).toEqual(['Fr', 'Fe', 'Fm'])
  })

  it('takes letters that differ only in case as the same', () => {
    expect(getSectionAbbreviations(['Kost', 'KOSTRA'])).toEqual(['Ko', 'KS'])
  })

  it('leaves out spaces, and keeps the second letter where every later one is taken', () => {
    expect(getSectionAbbreviations(['I drift', 'Aa', 'Aa'])).toEqual(['Id', 'Aa', 'Aa'])
  })

  it('keeps a name shorter than two letters as it is', () => {
    expect(getSectionAbbreviations(['X', '', 'q'])).toEqual(['X', '', 'q'])
  })
})
