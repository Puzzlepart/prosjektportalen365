import { ProjectColumn } from './ProjectColumn'

/**
 * A project column's widths, from the project columns list: its least width, 100 without one, and
 * the width the lists start it at (`GtColMaxWidth`, «Standard bredde»), none without one. Until
 * 1.15.0 the portfolio overview read only the least, and started every column there.
 */
describe('ProjectColumn', () => {
  it('takes its least width and the width it starts at from the list', () => {
    const column = new ProjectColumn({
      Title: 'Tittel',
      GtManagedProperty: 'Title',
      GtSortOrder: 10,
      GtColMinWidth: 250,
      GtColMaxWidth: 300
    })
    expect(column.minWidth).toBe(250)
    expect(column.maxWidth).toBe(300)
  })

  it('starts at its least width when the list gives no width to start at', () => {
    // SharePoint gives an empty number as null.
    const column = new ProjectColumn({
      Title: 'Fase',
      GtManagedProperty: 'GtProjectPhaseOWSCHCS',
      GtSortOrder: 40,
      GtColMinWidth: null,
      GtColMaxWidth: null
    })
    expect(column.minWidth).toBe(100)
    expect(column.maxWidth).toBeUndefined()
  })
})
