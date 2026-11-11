import { findColumnUsingProperty, isSameColumn } from './columnIdentity'

/**
 * Which column is which: two columns of a list can show the same managed property, so the id tells
 * them apart, and a new column may not take a property a column shows already.
 */
describe('columnIdentity', () => {
  it('tells two columns apart by their ids, though they show the same managed property', () => {
    expect(isSameColumn({ id: 36, key: 'SiteTitle' }, { id: 50, key: 'SiteTitle' })).toBe(false)
    expect(isSameColumn({ id: 36, key: 'SiteTitle' }, { id: 36, key: 'SiteTitle' })).toBe(true)
  })

  it('takes a column without an id for the one with its key, or its field name without a key', () => {
    // Columns saved in the web part's properties before they kept their ids have none.
    expect(isSameColumn({ key: 'GtBudgetTotal' }, { id: 4, key: 'GtBudgetTotal' })).toBe(true)
    expect(isSameColumn({ fieldName: 'GtBudgetTotal' }, { key: 'GtBudgetTotal' })).toBe(true)
    expect(isSameColumn({ key: 'GtBudgetTotal' }, { id: 4, key: 'Title' })).toBe(false)
    expect(isSameColumn({}, {})).toBe(false)
    expect(isSameColumn(undefined, { key: 'Title' })).toBe(false)
  })

  it('finds the column that shows a managed property, ignoring case and spaces, but not one deleted since', () => {
    const columns = [
      { id: 1, fieldName: 'Title', name: 'Tittel' },
      { id: 36, fieldName: 'SiteTitle', name: 'Prosjekt' }
    ]
    expect(findColumnUsingProperty(' sitetitle ', columns)?.name).toBe('Prosjekt')
    expect(findColumnUsingProperty('SiteTitle', columns, [36])).toBeUndefined()
    expect(findColumnUsingProperty('GtProjectNumberOWSTEXT', columns)).toBeUndefined()
    expect(findColumnUsingProperty('', columns)).toBeUndefined()
    expect(findColumnUsingProperty(undefined, columns)).toBeUndefined()
  })
})
