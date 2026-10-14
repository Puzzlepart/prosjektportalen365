import { getSustainabilityGoals } from './goalAssets'

describe('getSustainabilityGoals', () => {
  it('maps selected terms to local SVGs in goal order', () => {
    const goals = getSustainabilityGoals([
      { key: 'climate', name: '13. Stoppe klimaendringene' },
      { key: 'hunger', name: '02. Utrydde sult' },
      { key: 'energy', name: '7. Ren energi til alle' }
    ])

    expect(
      goals.map(({ id, name, number, iconUrl }) => ({ id, name, number, hasIcon: !!iconUrl }))
    ).toEqual([
      { id: 'hunger', name: '02. Utrydde sult', number: 2, hasIcon: true },
      { id: 'energy', name: '7. Ren energi til alle', number: 7, hasIcon: true },
      { id: 'climate', name: '13. Stoppe klimaendringene', number: 13, hasIcon: true }
    ])
  })

  it('ignores unknown, malformed and duplicate goals', () => {
    expect(
      getSustainabilityGoals([
        { key: 'first', name: '01. Utrydde fattigdom' },
        { key: 'duplicate', name: '1. No poverty' },
        { key: 'unknown', name: '18. Ukjent mål' },
        { key: 'malformed', name: 'Uten nummer' },
        null
      ]).map(({ id }) => id)
    ).toEqual(['first'])
  })
})
