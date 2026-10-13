// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The Excel export is a stand-in.
jest.mock('./useExcelExport', () => ({ useExcelExport: () => ({ exportToExcel: jest.fn() }) }))

import { render } from '@testing-library/react'
import * as strings from 'PortfolioWebPartsStrings'
import { ListMenuItem } from 'pp365-shared-library'
import * as React from 'react'
import { TOGGLE_COMPACT } from '../reducer'
import { useToolbarItems } from './useToolbarItems'

/**
 * The aggregated overview's toolbar: the list and compact choices in the view selector.
 */
function toolbar(state: Record<string, any>) {
  const dispatch = jest.fn()
  let items: ListMenuItem[] = []
  const Probe: React.FC = () => {
    items = useToolbarItems({
      state: { views: [], ...state },
      props: { showViewSelector: true, showExcelExportButton: true, showFilters: true },
      dispatch
    } as any)
    return null
  }
  render(<Probe />)
  const viewSelector = items.find((i) => i.items?.some((c) => c.name === 'renderMode'))
  const [list, compact] = viewSelector.items.filter((i) => i.name === 'renderMode')
  return { viewSelector, list, compact, dispatch }
}

describe('useToolbarItems', () => {
  it('the list and compact choices each set the mode they name, whichever mode is on', () => {
    for (const isCompact of [false, true]) {
      const { list, compact, dispatch } = toolbar({ isCompact })
      expect(list.text).toBe(strings.ListViewText)
      expect(compact.text).toBe(strings.CompactViewText)
      list.onClick(null)
      compact.onClick(null)
      expect(dispatch.mock.calls).toEqual([[TOGGLE_COMPACT(false)], [TOGGLE_COMPACT(true)]])
    }
  })

  it('checks the mode that is on', () => {
    expect(toolbar({ isCompact: false }).viewSelector.checkedValues.renderMode).toEqual(['list'])
    expect(toolbar({ isCompact: true }).viewSelector.checkedValues.renderMode).toEqual([
      'compactList'
    ])
  })
})
