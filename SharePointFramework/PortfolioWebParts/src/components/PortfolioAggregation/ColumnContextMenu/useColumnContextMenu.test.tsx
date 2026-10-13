// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The list's cells reach ProjectWebParts' project information,
// which loads modules Jest cannot run; stand-ins, as in PortfolioAggregation.test.tsx.
jest.mock('pp365-projectwebparts/lib/components/ProjectInformationPanel', () => ({
  ProjectInformationPanel: ({ children }: any) => children ?? null
}))
jest.mock('pp365-projectwebparts/lib/components/ProjectInformation', () => ({
  ProjectInformationPanel: ({ children }: any) => children ?? null
}))

import { render } from '@testing-library/react'
import * as strings from 'PortfolioWebPartsStrings'
import { IMenuItem, ProjectContentColumn } from 'pp365-shared-library'
import * as React from 'react'
import { PortfolioAggregationContext } from '../context'
import { SET_SORT } from '../reducer'
import { useColumnContextMenu } from './useColumnContextMenu'

/**
 * The aggregated overview's column menu: the two sort choices, what each asks the list for, and
 * which one is checked. The menu itself is not opened (Fluent's menus hang under jsdom).
 */
const title = () =>
  new ProjectContentColumn({
    Id: 2,
    Title: 'Tittel',
    GtInternalName: 'Title',
    GtManagedProperty: 'Title',
    GtFieldDataType: 'Text',
    GtColMinWidth: 100
  })

function menuFor(column: ProjectContentColumn) {
  const dispatch = jest.fn()
  let items: IMenuItem[] = []
  const Probe: React.FC = () => {
    items = useColumnContextMenu().items
    return null
  }
  render(
    <PortfolioAggregationContext.Provider
      value={
        {
          state: { columns: [column], columnContextMenu: { column, target: null } },
          props: { pageContext: { legacyPageContext: { isSiteAdmin: false } } },
          dispatch
        } as any
      }
    >
      <Probe />
    </PortfolioAggregationContext.Provider>
  )
  // `SortDescLabel` reads "A til Å" and `SortAscLabel` "Å til A".
  const aToZ = items.find((i) => i.text === strings.SortDescLabel)
  const zToA = items.find((i) => i.text === strings.SortAscLabel)
  return { aToZ, zToA, dispatch, checked: [!!aToZ.checked, !!zToA.checked] }
}

describe('useColumnContextMenu', () => {
  it('"A til Å" sorts ascending and "Å til A" descending', () => {
    const column = title()
    const { aToZ, zToA, dispatch } = menuFor(column)
    aToZ.onClick(null)
    zToA.onClick(null)
    expect(dispatch.mock.calls).toEqual([
      [SET_SORT({ column, isSortedDescending: false })],
      [SET_SORT({ column, isSortedDescending: true })]
    ])
  })

  it('checks the direction the column is sorted in, and neither when it is not sorted', () => {
    const column = title()
    expect(menuFor(column).checked).toEqual([false, false])
    column.isSorted = true
    column.isSortedDescending = false
    expect(menuFor(column).checked).toEqual([true, false])
    column.isSortedDescending = true
    expect(menuFor(column).checked).toEqual([false, true])
  })
})
