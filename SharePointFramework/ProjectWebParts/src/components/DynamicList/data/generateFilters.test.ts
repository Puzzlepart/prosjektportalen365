import { generateFilters } from './generateFilters'

/**
 * The filters a list offers: one per column worth filtering, with the distinct values of the
 * rows sorted the Norwegian way, user and lookup values shown by their names, and no filter for
 * metadata, long text, a single value or more than a hundred.
 */
const column = (fieldName: string, name = fieldName) => ({
  key: fieldName,
  fieldName,
  name,
  minWidth: 100
})

describe('generateFilters', () => {
  it('offers a filter per column with more than one value, sorted, with the configuration it needs', () => {
    const filters = generateFilters({
      listColumns: [column('Title'), column('Status', 'Status'), column('ID')],
      listItems: [
        { Title: 'Ørn', Status: 'Pågår', ID: 1 },
        { Title: 'Ask', Status: 'Ferdig', ID: 2 },
        { Title: 'Ask', Status: 'Pågår', ID: 3 }
      ]
    } as any)
    expect(filters.map((f) => f.column.fieldName)).toEqual(['Title', 'Status'])
    expect(filters[0].items.map((i) => i.name)).toEqual(['Ask', 'Ørn'])
    expect(filters[1].items.map((i) => [i.name, i.value, i.selected])).toEqual([
      ['Ferdig', 'Ferdig', false],
      ['Pågår', 'Pågår', false]
    ])
  })

  it('splits multi-value fields and names users and lookups', () => {
    const filters = generateFilters({
      listColumns: [column('GtTags'), column('AuthorOWSUSER'), column('Lookup')],
      listItems: [
        { GtTags: 'A;B', AuthorOWSUSER: 'kari@contoso.no | Kari Nordmann | 1', Lookup: '1;#Alfa' },
        {
          GtTags: 'B;C',
          AuthorOWSUSER: 'ola@contoso.no | Ola Nordmann | 2',
          Lookup: '2;#Bravo;#3;#Charlie'
        }
      ]
    } as any)
    expect(filters[0].items.map((i) => i.value)).toEqual(['A', 'B', 'C'])
    expect(filters[1].items.map((i) => i.name)).toEqual(['Kari Nordmann', 'Ola Nordmann'])
    expect(filters[2].items.map((i) => [i.name, i.value])).toEqual([
      ['Alfa', '1;#Alfa'],
      ['Bravo', '2;#Bravo'],
      ['Charlie', '3;#Charlie']
    ])
  })

  it('skips metadata, long text, excluded columns, empty values and single values', () => {
    const filters = generateFilters(
      {
        listColumns: [
          column('Modified'),
          column('GtDescription'),
          column('Secret'),
          column('OnlyOne'),
          column('Empty')
        ],
        listItems: [
          { Modified: '1', GtDescription: 'a', Secret: 'x', OnlyOne: 'same', Empty: '' },
          { Modified: '2', GtDescription: 'b', Secret: 'y', OnlyOne: 'same', Empty: ' ' }
        ]
      } as any,
      ['Secret']
    )
    expect(filters).toEqual([])
  })

  it('gives nothing without rows or columns', () => {
    expect(generateFilters({ listColumns: [], listItems: [{ Title: 'x' }] } as any)).toEqual([])
    expect(generateFilters({ listColumns: [column('Title')], listItems: [] } as any)).toEqual([])
    expect(generateFilters(undefined)).toEqual([])
  })
})
