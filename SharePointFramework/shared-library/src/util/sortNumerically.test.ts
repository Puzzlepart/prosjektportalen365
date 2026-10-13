import { sortNumerically } from './sortNumerically'

/**
 * Sorting a column of numbers, amounts or percentages: search returns their values as text, so
 * they are compared by the number they hold, not as text ("4" before "30"); a value that is no
 * number, such as a date, is compared as it is.
 */
describe('sortNumerically', () => {
  const sorted = (values: any[], ascending: boolean, symbol?: string) =>
    values
      .map((v) => ({ v }))
      .sort((a, b) => sortNumerically(a, b, ascending, 'v', symbol))
      .map((row) => row.v)

  it('compares numbers given as text by their value', () => {
    expect(sorted(['30', '4', '100', '-2.5'], true)).toEqual(['-2.5', '4', '30', '100'])
    expect(sorted(['30', '4', '100'], false)).toEqual(['100', '30', '4'])
  })

  it('compares numbers by their value', () => {
    expect(sorted([30, 4, 100], true)).toEqual([4, 30, 100])
    expect(sorted([30, 4, 100], false)).toEqual([100, 30, 4])
  })

  it('compares amounts and percentages by their number once the symbol is gone', () => {
    expect(sorted(['kr 30', 'kr 4', 'kr 100'], true, 'kr ')).toEqual(['kr 4', 'kr 30', 'kr 100'])
    expect(sorted(['50%', '5%', '100%'], false, '%')).toEqual(['100%', '50%', '5%'])
  })

  it('compares values that are no number as they are', () => {
    expect(sorted(['2026-10-09', '2025-01-31'], true)).toEqual(['2025-01-31', '2026-10-09'])
  })
})
