import strings from 'PortfolioWebPartsStrings'
import { createGroups, parseDisplayValue } from './createGroups'

/**
 * The aggregated overview's groups: one per run of equal values in the items the list shows,
 * named after the column and the value as it is displayed.
 */
const PHASE = { fieldName: 'GtProjectPhase', name: 'Fase' } as any

const item = (Title: string, GtProjectPhase?: string) => ({ Title, GtProjectPhase })

describe('createGroups', () => {
  it('makes a group of each run of equal values, where the run starts', () => {
    const items = [
      item('Alfa', 'Konsept'),
      item('Bravo', 'Planlegge'),
      item('Charlie', 'Planlegge'),
      item('Delta')
    ]
    expect(createGroups(items, PHASE)).toEqual([
      { key: 'Group_0', name: 'Fase: Konsept', startIndex: 0, count: 1 },
      { key: 'Group_1', name: 'Fase: Planlegge', startIndex: 1, count: 2 },
      { key: 'Group_2', name: `Fase: ${strings.NotSet}`, startIndex: 3, count: 1 }
    ])
  })

  it('groups the items the list shows, not all of them', () => {
    // A search for "a" leaves Bravo out of the four items above: Charlie is the only Planlegge
    // left, at index 1 of what is shown.
    const shown = [item('Alfa', 'Konsept'), item('Charlie', 'Planlegge')]
    expect(createGroups(shown, PHASE)).toEqual([
      { key: 'Group_0', name: 'Fase: Konsept', startIndex: 0, count: 1 },
      { key: 'Group_1', name: 'Fase: Planlegge', startIndex: 1, count: 1 }
    ])
  })

  it('does not group without a column to group by', () => {
    expect(createGroups([item('Alfa', 'Konsept')], undefined)).toBeUndefined()
  })

  it('names a group by the value as it is displayed', () => {
    expect(parseDisplayValue('3;#Gjennomføring')).toBe('Gjennomføring')
    expect(parseDisplayValue('#10.0000000000000')).toBe('10')
    expect(parseDisplayValue('2.50000000000000')).toBe('2.5')
    expect(parseDisplayValue('Konsept')).toBe('Konsept')
  })
})
