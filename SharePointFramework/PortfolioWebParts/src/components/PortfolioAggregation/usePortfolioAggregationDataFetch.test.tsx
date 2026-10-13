import { act, render, waitFor } from '@testing-library/react'
import { DataSource, ProjectContentColumn } from 'pp365-shared-library'
import * as React from 'react'
import { SET_DATA_SOURCE } from './reducer/actions'
import { createPortfolioAggregationReducer } from './reducer/createPortfolioAggregationReducer'
import { getInitialState } from './reducer/getInitialState'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'
import { usePortfolioAggregationDataFetch } from './usePortfolioAggregationDataFetch'

/**
 * The aggregated overview's fetch run against its real reducer, as the web part runs it: each
 * view the user picks is fetched, and its rows are grouped by the view's group column.
 */
const column = (Id: number, Title: string, fieldName: string, extra: Record<string, any> = {}) =>
  new ProjectContentColumn({
    Id,
    Title,
    GtInternalName: fieldName,
    GtManagedProperty: fieldName,
    GtFieldDataType: 'Text',
    GtColMinWidth: 100,
    GtSortOrder: Id * 10,
    ...extra
  })

const title = column(2, 'Tittel', 'Title')
const phase = column(3, 'Fase', 'GtProjectPhase', { GtIsGroupable: true })
const view = (Id: number, Title: string, GtProjectContentGroupById?: number) =>
  new DataSource(
    {
      Id,
      Title,
      GtDataSourceLevel: ['Portefølje'],
      GtProjectContentColumnsId: [2, 3],
      GtProjectContentGroupById
    } as any,
    [title, phase]
  )
const allDeliveries = view(1, 'Alle leveranser', 3)
const myDeliveries = view(2, 'Mine leveranser', 3)
const ungroupedDeliveries = view(3, 'Leveranser uten gruppering')

function renderFetch() {
  const fetchItemsWithSource = jest.fn(() =>
    Promise.resolve([
      { SiteTitle: 'Bravo', Title: 'B', GtProjectPhase: 'Realisere' },
      { SiteTitle: 'Alfa', Title: 'A', GtProjectPhase: 'Konsept' }
    ])
  )
  const props = {
    dataAdapter: { fetchItemsWithSource },
    dataSourceCategory: 'Leveranser',
    configuration: {
      views: [allDeliveries, myDeliveries, ungroupedDeliveries],
      columns: [title, phase],
      refiners: []
    },
    onUpdateProperty: jest.fn()
  } as unknown as IPortfolioAggregationProps
  const reducer = createPortfolioAggregationReducer(props, getInitialState(props))
  const latest: { state?: IPortfolioAggregationState; dispatch?: React.Dispatch<any> } = {}
  const Probe: React.FC = () => {
    const [state, dispatch] = React.useReducer(reducer, getInitialState(props))
    Object.assign(latest, { state, dispatch })
    usePortfolioAggregationDataFetch({ props, state, dispatch } as any, [state.currentView])
    return null
  }
  render(<Probe />)
  /** Picks a view, as the view selector does, and waits for its rows. */
  const pickView = async (dataSource: DataSource) => {
    const calls = fetchItemsWithSource.mock.calls.length
    act(() => latest.dispatch(SET_DATA_SOURCE({ dataSource })))
    await waitFor(() => expect(fetchItemsWithSource).toHaveBeenCalledTimes(calls + 1))
    await waitFor(() => expect(latest.state.loading).toBe(false))
    return latest.state
  }
  return { pickView }
}

describe('usePortfolioAggregationDataFetch', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it("groups a view's rows by its group column", async () => {
    const { pickView } = renderFetch()
    const state = await pickView(allDeliveries)
    expect(state.groupBy?.fieldName).toBe('GtProjectPhase')
    expect(state.items.map((i) => i.GtProjectPhase)).toEqual(['Konsept', 'Realisere'])
  })

  it('keeps the grouping when the next view is grouped by the same column', async () => {
    const { pickView } = renderFetch()
    await pickView(allDeliveries)
    const state = await pickView(myDeliveries)
    expect(state.currentView).toBe(myDeliveries)
    expect(state.groupBy?.fieldName).toBe('GtProjectPhase')
  })

  it('ends the grouping when the next view has no group column', async () => {
    const { pickView } = renderFetch()
    await pickView(allDeliveries)
    const state = await pickView(ungroupedDeliveries)
    expect(state.groupBy).toBeNull()
    expect(state.items.map((i) => i.SiteTitle)).toEqual(['Alfa', 'Bravo'])
  })
})
