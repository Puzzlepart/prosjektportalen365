import { sortItems } from './sortItems'

/**
 * The one sort of the hub's lists, `Porteføljeoversikt` and `Aggregert oversikt`, grouped or not:
 * a column sorts as its type of data reads, or in the order configured for its values.
 */
describe('sortItems', () => {
  const titles = (items: Record<string, any>[]) => items.map((i) => i.Title)

  it('sorts text ignoring case, both ways', () => {
    const items = () => [{ Title: 'Bravo' }, { Title: 'alfa' }, { Title: 'Charlie' }]
    const title = { fieldName: 'Title', dataType: 'text' }
    expect(titles(sortItems(items(), title, true))).toEqual(['alfa', 'Bravo', 'Charlie'])
    expect(titles(sortItems(items(), title, false))).toEqual(['Charlie', 'Bravo', 'alfa'])
  })

  it('sorts numbers, amounts and percentages by their number, as search returns them in text', () => {
    const items = () => [
      { Title: 'Ti', Budget: '10', Costs: 'kr 1000', Progress: '5%' },
      { Title: 'To', Budget: '2', Costs: 'kr 30', Progress: '100%' },
      { Title: 'Hundre', Budget: '100', Costs: 'kr 200', Progress: '50%' }
    ]
    const sortBy = (fieldName: string, dataType: string, ascending: boolean) =>
      titles(sortItems(items(), { fieldName, dataType }, ascending))
    expect(sortBy('Budget', 'number', true)).toEqual(['To', 'Ti', 'Hundre'])
    expect(sortBy('Budget', 'number', false)).toEqual(['Hundre', 'Ti', 'To'])
    expect(sortBy('Costs', 'currency', true)).toEqual(['To', 'Hundre', 'Ti'])
    expect(sortBy('Progress', 'percentage', true)).toEqual(['Ti', 'Hundre', 'To'])
  })

  it('sorts in the order configured for the values when there is one', () => {
    const items = () => [
      { Title: 'Alfa', Phase: 'Avslutte' },
      { Title: 'Bravo', Phase: 'Konsept' },
      { Title: 'Charlie', Phase: 'Gjennomføre' }
    ]
    const phase = { fieldName: 'Phase', dataType: 'text' }
    // Not the alphabetical order.
    const order = ['Konsept', 'Planlegge', 'Gjennomføre', 'Avslutte']
    expect(titles(sortItems(items(), phase, true, order))).toEqual(['Bravo', 'Charlie', 'Alfa'])
    expect(titles(sortItems(items(), phase, false, order))).toEqual(['Alfa', 'Charlie', 'Bravo'])
  })
})
