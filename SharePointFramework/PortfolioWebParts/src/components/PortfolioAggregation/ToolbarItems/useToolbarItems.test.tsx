// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The Excel export is a stand-in.
jest.mock('./useExcelExport', () => ({ useExcelExport: () => ({ exportToExcel: jest.fn() }) }))

import { render } from '@testing-library/react'
import * as strings from 'PortfolioWebPartsStrings'
import { ListMenuItem, format } from 'pp365-shared-library'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import resource from 'SharedResources'
import { SET_DATA_SOURCE, TOGGLE_COMPACT } from '../reducer'
import { useToolbarItems } from './useToolbarItems'

/**
 * The aggregated overview's toolbar: the list and compact choices and the data sources in the
 * view selector. A data source and a layout picked there are counted, once per pick, for the web
 * part the overview is in: the hub's or a program's.
 */
const DELIVERIES = { id: 1, title: 'Alle leveranser', iconName: 'Box' }
const LATE = { id: 2, title: 'Forsinkede leveranser', iconName: 'Clock' }

function toolbar(state: Record<string, any>, alias = 'PortfolioAggregationWebPart') {
  const dispatch = jest.fn()
  let items: ListMenuItem[] = []
  /** Capture toolbar commands and the actions their callbacks dispatch. */
  const Probe: React.FC = () => {
    items = useToolbarItems({
      state: { views: [], ...state },
      props: { showViewSelector: true, showExcelExportButton: true, showFilters: true },
      dispatch
    } as any)
    return null
  }
  render(
    <TelemetryProvider component={alias}>
      <Probe />
    </TelemetryProvider>
  )
  const viewSelector = items.find((i) => i.items?.some((c) => c.name === 'renderMode'))
  const [list, compact] = viewSelector.items.filter((i) => i.name === 'renderMode')
  const dataSources = viewSelector.items.filter((i) => i.name === 'views')
  return { viewSelector, list, compact, dataSources, dispatch }
}

beforeEach(() => startTestTelemetry())

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

  it('names the view selector by what it chooses as well as the view it shows (WCAG 2.4.6)', () => {
    const { viewSelector } = toolbar({ currentView: { id: 1, title: 'Alle prosjekter' } })
    expect(viewSelector.text).toBe('Alle prosjekter')
    expect(viewSelector.ariaLabel).toBe(
      format(strings.SelectorButtonLabel, 'Alle prosjekter', resource.Lists_PortfolioViews_Title)
    )
  })

  it('checks the mode that is on', () => {
    expect(toolbar({ isCompact: false }).viewSelector.checkedValues.renderMode).toEqual(['list'])
    expect(toolbar({ isCompact: true }).viewSelector.checkedValues.renderMode).toEqual([
      'compactList'
    ])
  })

  it('lists the data sources, checks the one shown and shows the one picked', () => {
    const { viewSelector, dataSources, dispatch } = toolbar({
      views: [DELIVERIES, LATE],
      currentView: DELIVERIES
    })
    expect(dataSources.map((item) => [item.text, item.value])).toEqual([
      ['Alle leveranser', '1'],
      ['Forsinkede leveranser', '2']
    ])
    expect(viewSelector.checkedValues.views).toEqual(['1'])
    dataSources[1].onClick(null)
    expect(dispatch.mock.calls).toEqual([[SET_DATA_SOURCE({ dataSource: LATE as any })]])
  })

  it('counts each data source and each layout picked, once, for the web part the overview is in', () => {
    const { list, compact, dataSources } = toolbar({ views: [DELIVERIES, LATE] })
    dataSources[1].onClick(null)
    expect(countedTelemetry().usage).toEqual({
      'PortfolioAggregationWebPart dataSource.switched': 1
    })
    compact.onClick(null)
    list.onClick(null)
    dataSources[0].onClick(null)
    expect(countedTelemetry().usage).toEqual({
      'PortfolioAggregationWebPart dataSource.switched': 2,
      'PortfolioAggregationWebPart layout.toggled': 2
    })

    // A program reuses the overview under its own web part.
    const program = toolbar({ views: [DELIVERIES, LATE] }, 'ProgramAggregationWebPart')
    program.dataSources[0].onClick(null)
    program.compact.onClick(null)
    expect(countedTelemetry()).toEqual({
      usage: {
        'PortfolioAggregationWebPart dataSource.switched': 2,
        'PortfolioAggregationWebPart layout.toggled': 2,
        'ProgramAggregationWebPart dataSource.switched': 1,
        'ProgramAggregationWebPart layout.toggled': 1
      },
      errors: {},
      timings: {}
    })
  })

  it('counts neither for a web part the contract gives none, such as the idea module', () => {
    // The idea module shows its ideas in an aggregated overview of its own.
    const { compact, dataSources, dispatch } = toolbar({ views: [DELIVERIES] }, 'IdeaModuleWebPart')
    dataSources[0].onClick(null)
    compact.onClick(null)
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(countedTelemetry().usage).toEqual({})
  })
})
