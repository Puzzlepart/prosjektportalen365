import { applyActiveFilters } from './applyActiveFilters'

/**
 * The portfolio overview's active filters, shared by the list and the Excel export: a value is
 * kept when it contains one of the values chosen for its column, every column's filter must
 * hold, and a Yes/No column compares the normalized value, so an item without one is a No.
 */
const ITEMS = [
  { Title: 'Alfa', GtProjectPhase: 'Konsept', GtIsProgram: '1' },
  { Title: 'Bravo', GtProjectPhase: 'Planlegge', GtIsProgram: '0' },
  { Title: 'Charlie', GtProjectPhase: 'Planlegge videre' },
  { Title: 'Delta' }
]

function contextWith(
  activeFilters: Record<string, string[]> | undefined,
  { refiners, columns }: { refiners?: any[]; columns?: any[] } = {}
) {
  return {
    state: { activeFilters, columns },
    props: { configuration: refiners ? { refiners } : undefined }
  } as any
}

const titles = (items: any[]) => items.map((item) => item.Title)

describe('applyActiveFilters', () => {
  it('keeps every item without active filters', () => {
    expect(applyActiveFilters(ITEMS, contextWith(undefined))).toBe(ITEMS)
    expect(titles(applyActiveFilters(ITEMS, contextWith({})))).toEqual([
      'Alfa',
      'Bravo',
      'Charlie',
      'Delta'
    ])
  })

  it('keeps the items whose value contains one of the chosen values, and drops those without one', () => {
    expect(
      titles(applyActiveFilters(ITEMS, contextWith({ GtProjectPhase: ['Planlegge'] })))
    ).toEqual(['Bravo', 'Charlie'])
    expect(
      titles(applyActiveFilters(ITEMS, contextWith({ GtProjectPhase: ['Konsept', 'videre'] })))
    ).toEqual(['Alfa', 'Charlie'])
  })

  it('makes every filtered column hold', () => {
    expect(
      titles(
        applyActiveFilters(
          ITEMS,
          contextWith({ GtProjectPhase: ['Planlegge'], Title: ['Charlie'] })
        )
      )
    ).toEqual(['Charlie'])
  })

  it('compares a Yes/No column on the normalized value, from the refiners or the columns', () => {
    // GtIsProgram is always Yes/No; an item without a value is a No, as the list shows it.
    expect(
      titles(
        applyActiveFilters(
          ITEMS,
          contextWith({ GtIsProgram: ['0'] }, { columns: [{ fieldName: 'GtIsProgram' }] })
        )
      )
    ).toEqual(['Bravo', 'Charlie', 'Delta'])
    // A column configured as Yes/No, known from the refiners where the persisted columns lack
    // the data type.
    const flagged = [{ Title: 'Alfa', GtFlag: '1' }, { Title: 'Bravo' }]
    expect(
      titles(
        applyActiveFilters(
          flagged,
          contextWith(
            { GtFlag: ['1'] },
            { refiners: [{ fieldName: 'GtFlag', dataType: 'boolean' }] }
          )
        )
      )
    ).toEqual(['Alfa'])
  })
})
