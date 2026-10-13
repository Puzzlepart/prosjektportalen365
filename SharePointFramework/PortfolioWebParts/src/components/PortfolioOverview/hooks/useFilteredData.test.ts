import strings from 'PortfolioWebPartsStrings'
import { IPortfolioOverviewContext } from '../context'
import { applyActiveFilters } from './applyActiveFilters'
import { getBooleanDisplayValue, isBooleanColumn, normalizeBooleanValue } from './booleanColumn'
import { useFilteredData } from './useFilteredData'

/**
 * What the overview shows of its items: the search filters on every column, the active filters
 * narrow further, and a group-by column turns the rows into sorted groups, with boolean columns
 * grouped on their Yes/No meaning so that items without a value land with the No group. These
 * rules live outside the list, so they must survive the list's move to v9 unchanged.
 */
const column = (fieldName: string, name: string, extra: Record<string, any> = {}) => ({
  key: fieldName,
  fieldName,
  name,
  minWidth: 100,
  dataType: 'text',
  ...extra
})

const columns = [column('Title', 'Tittel'), column('GtProjectPhase', 'Fase')]

function context(state: Record<string, any>): IPortfolioOverviewContext {
  return {
    props: { configuration: { refiners: [] } },
    state: { items: [], columns, searchTerm: '', activeFilters: {}, ...state }
  } as any
}

const titles = (items: Record<string, any>[]) => items.map((i) => i.Title)

/** The rows as the list shows them: group by group, each group's rows from its start index. */
const shown = (result: ReturnType<typeof useFilteredData>) =>
  result.groups.flatMap((g) => titles(result.items.slice(g.startIndex, g.startIndex + g.count)))

describe('useFilteredData', () => {
  it('keeps every item and makes no groups without a search, filters or group-by', () => {
    const items = [{ Title: 'Bravo' }, { Title: 'Alfa' }]
    const result = useFilteredData(context({ items }))
    expect(titles(result.items)).toEqual(['Bravo', 'Alfa'])
    expect(result.groups).toBeNull()
  })

  it('searches every column, case-insensitively', () => {
    const items = [
      { Title: 'Alfa', GtProjectPhase: 'Konsept' },
      { Title: 'Bravo', GtProjectPhase: 'Planlegge' },
      { Title: 'Charlie konsept', GtProjectPhase: 'Realisere' }
    ]
    // The reducer lowercases the term before it reaches here.
    const result = useFilteredData(context({ items, searchTerm: 'konsept' }))
    expect(titles(result.items)).toEqual(['Alfa', 'Charlie konsept'])
  })

  it('groups the items by the column, sorted by the group value, with "not set" for a missing value', () => {
    const items = [
      { Title: 'Charlie', GtProjectPhase: 'Planlegge' },
      { Title: 'Alfa', GtProjectPhase: 'Konsept' },
      { Title: 'Delta' },
      { Title: 'Bravo', GtProjectPhase: 'Planlegge' }
    ]
    const result = useFilteredData(context({ items, groupBy: columns[1] }))
    // The rows are sorted by the raw value, with the missing value last; the groups are listed
    // alphabetically by their label, each pointing at its rows through startIndex.
    expect(titles(result.items)).toEqual(['Alfa', 'Charlie', 'Bravo', 'Delta'])
    expect(result.groups.map((g) => [g.name, g.startIndex, g.count])).toEqual([
      [`Fase: ${strings.NotSet}`, 3, 1],
      ['Fase: Konsept', 0, 1],
      ['Fase: Planlegge', 1, 2]
    ])
    // The groups start open.
    expect(result.groups.every((g) => !g.isCollapsed)).toBe(true)
  })

  it('sorts the items within their groups by the sort column', () => {
    const items = [
      { Title: 'Charlie', GtProjectPhase: 'Planlegge' },
      { Title: 'Alfa', GtProjectPhase: 'Konsept' },
      { Title: 'Bravo', GtProjectPhase: 'Planlegge' }
    ]
    const ascending = useFilteredData(
      context({
        items,
        groupBy: columns[1],
        sortBy: { column: { ...columns[0], isSortedDescending: false } }
      })
    )
    expect(titles(ascending.items)).toEqual(['Alfa', 'Bravo', 'Charlie'])
    const descending = useFilteredData(
      context({
        items,
        groupBy: columns[1],
        sortBy: { column: { ...columns[0], isSortedDescending: true } }
      })
    )
    // The groups keep their order; the rows within them turn.
    expect(shown(descending)).toEqual(['Alfa', 'Charlie', 'Bravo'])
  })

  it('sorts numbers within their groups by their value, as the list does without groups', () => {
    const budget = column('GtBudgetTotal', 'Budsjett', { dataType: 'number' })
    // Search returns numbers as text.
    const items = [
      { Title: 'Tretti', GtProjectPhase: 'Planlegge', GtBudgetTotal: '30' },
      { Title: 'Fire', GtProjectPhase: 'Planlegge', GtBudgetTotal: '4' },
      { Title: 'Hundre', GtProjectPhase: 'Planlegge', GtBudgetTotal: '100' }
    ]
    const result = useFilteredData(
      context({
        items,
        groupBy: columns[1],
        sortBy: { column: { ...budget, isSortedDescending: false } }
      })
    )
    expect(shown(result)).toEqual(['Fire', 'Tretti', 'Hundre'])
  })

  it('keeps the order configured for a column (a custom sort) within the groups', () => {
    const phase = columns[1]
    const program = column('GtIsProgram', 'Program', { dataType: 'boolean' })
    const items = [
      { Title: 'Alfa', GtProjectPhase: 'Avslutte', GtIsProgram: '1' },
      { Title: 'Bravo', GtProjectPhase: 'Konsept', GtIsProgram: '1' },
      { Title: 'Charlie', GtProjectPhase: 'Gjennomføre', GtIsProgram: '1' }
    ]
    const result = useFilteredData(
      context({
        items,
        columns: [...columns, program],
        groupBy: program,
        sortBy: {
          column: { ...phase, isSortedDescending: false },
          customSort: {
            name: 'Faserekkefølge',
            order: ['Konsept', 'Planlegge', 'Gjennomføre', 'Avslutte']
          }
        }
      })
    )
    expect(shown(result)).toEqual(['Bravo', 'Charlie', 'Alfa'])
  })

  it('groups a boolean column on Yes/No, with items without a value under No', () => {
    const program = column('GtIsProgram', 'Program', { dataType: 'boolean' })
    const items = [
      { Title: 'Alfa', GtIsProgram: '1' },
      { Title: 'Bravo' },
      { Title: 'Charlie', GtIsProgram: '0' }
    ]
    const result = useFilteredData(
      context({ items, columns: [...columns, program], groupBy: program })
    )
    expect(result.groups.map((g) => [g.name, g.count])).toEqual([
      [`Program: ${strings.BooleanNo}`, 2],
      [`Program: ${strings.BooleanYes}`, 1]
    ])
    expect(titles(result.items)).toEqual(['Bravo', 'Charlie', 'Alfa'])
  })

  it('applies the active filters, on the normalized value for boolean columns', () => {
    const program = column('GtIsProgram', 'Program', { dataType: 'boolean' })
    const items = [
      { Title: 'Alfa', GtProjectPhase: 'Konsept', GtIsProgram: '1' },
      { Title: 'Bravo', GtProjectPhase: 'Planlegge' },
      { Title: 'Charlie', GtProjectPhase: 'Konsept' }
    ]
    const ctx = context({ items, columns: [...columns, program] })
    expect(
      titles(
        applyActiveFilters(items, {
          ...ctx,
          state: { ...ctx.state, activeFilters: { GtProjectPhase: ['Konsept'] } }
        })
      )
    ).toEqual(['Alfa', 'Charlie'])
    expect(
      titles(
        applyActiveFilters(items, {
          ...ctx,
          state: { ...ctx.state, activeFilters: { GtIsProgram: ['0'] } }
        })
      )
    ).toEqual(['Bravo', 'Charlie'])
    expect(
      titles(
        useFilteredData({
          ...ctx,
          state: {
            ...ctx.state,
            activeFilters: { GtProjectPhase: ['Konsept'], GtIsProgram: ['1'] }
          }
        }).items
      )
    ).toEqual(['Alfa'])
  })

  it('tells boolean columns by data type or by the built-in program and parent fields', () => {
    expect(isBooleanColumn(column('GtIsProgram', 'Program') as any)).toBe(true)
    expect(isBooleanColumn(column('GtIsParentProject', 'Overordnet') as any)).toBe(true)
    expect(isBooleanColumn(column('GtActive', 'Aktiv', { dataType: 'boolean' }) as any)).toBe(true)
    expect(isBooleanColumn(column('GtProjectPhase', 'Fase') as any)).toBe(false)
    expect(isBooleanColumn(undefined)).toBe(false)
    expect(normalizeBooleanValue('1')).toBe('1')
    expect(normalizeBooleanValue(1)).toBe('1')
    expect(normalizeBooleanValue('0')).toBe('0')
    expect(normalizeBooleanValue(undefined)).toBe('0')
    const labelled = column('GtActive', 'Aktiv', {
      dataType: 'boolean',
      data: { dataTypeProperties: { valueIfTrue: 'Aktiv', valueIfFalse: 'Avsluttet' } }
    })
    expect(getBooleanDisplayValue(labelled as any, '1')).toBe('Aktiv')
    expect(getBooleanDisplayValue(labelled as any, undefined)).toBe('Avsluttet')
    expect(getBooleanDisplayValue(column('GtActive', 'Aktiv') as any, '1')).toBe(strings.BooleanYes)
  })
})
