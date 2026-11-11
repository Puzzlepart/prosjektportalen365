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

  it('names a group by a person, a term or a lookup as they are displayed', () => {
    // A person from search: the e-mail, the name and the claims, separated by pipes.
    expect(
      parseDisplayValue(
        'kari@contoso.no | Kari Nordmann | 693A30232E667C6D656D626572736869707C6B617269 i:0#.f|membership|kari@contoso.no'
      )
    ).toBe('Kari Nordmann')
    expect(parseDisplayValue('kari@contoso.no | Kari Nordmann')).toBe('Kari Nordmann')
    expect(parseDisplayValue('Kari | ')).toBe('Kari | ')
    expect(parseDisplayValue('L0|#0a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d|Konsept')).toBe('Konsept')
    expect(parseDisplayValue('3;#Gjennomføring|8f3c2d1e-0000-4000-8000-000000000000')).toBe(
      'Gjennomføring'
    )
    // A lookup without a label stays as stored.
    expect(parseDisplayValue('3;#')).toBe('3;#')
  })

  it('leaves no value as it is', () => {
    expect(parseDisplayValue('')).toBe('')
    expect(parseDisplayValue(undefined)).toBeUndefined()
  })
})
