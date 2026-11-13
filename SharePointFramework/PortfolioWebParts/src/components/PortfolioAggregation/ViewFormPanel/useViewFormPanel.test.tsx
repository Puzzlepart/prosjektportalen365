import { act, renderHook } from '@testing-library/react'
import { DataSource } from 'pp365-shared-library'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import React, { FC, PropsWithChildren } from 'react'
import { PortfolioAggregationContext } from '../context'
import { SET_VIEW_FORM_PANEL } from '../reducer'
import { useViewFormPanel } from './useViewFormPanel'

/**
 * Saving a view (a data source) of the aggregated overview: a new one is added to the data sources
 * with the columns of the view it was made from, an edited one is updated, and the form closes
 * with the view. A save the list refuses is thrown on, and counted once by what the list answered.
 * The contract gives the aggregated overview no event for a saved view, so a save counts none.
 */
const QUERY = 'ContentTypeId:0x010088578E7470CC4AA68D5663464831070209* GtDeliveryStatusOWSCHCS:*'

/**
 * The form's hook in an overview that shows `Alle leveranser`, open for a new view or to edit the
 * one shown.
 *
 * @param isEditing Whether the form edits the view shown
 */
function formHook(isEditing: boolean) {
  const view = new DataSource({
    Id: 1,
    Title: 'Alle leveranser',
    GtSearchQuery: QUERY,
    GtProjectContentColumnsId: [2, 3],
    GtProjectContentRefinersId: [3],
    GtProjectContentGroupById: 3
  })
  const portalDataService = {
    updateItemInList: jest.fn((..._args: unknown[]) => Promise.resolve()),
    addItemToList: jest.fn((..._args: unknown[]) => Promise.resolve({ Id: 9 }))
  }
  const context = {
    props: {
      dataAdapter: { portalDataService },
      dataSourceCategory: 'Leveranser',
      configuration: { level: 'Portefølje' }
    },
    state: { currentView: view, viewForm: isEditing ? { isOpen: true, view } : { isOpen: true } },
    dispatch: jest.fn()
  } as any
  const WebPart: FC<PropsWithChildren> = ({ children }) => (
    <TelemetryProvider component='PortfolioAggregationWebPart'>
      <PortfolioAggregationContext.Provider value={context}>
        {children}
      </PortfolioAggregationContext.Provider>
    </TelemetryProvider>
  )
  const { result } = renderHook(() => useViewFormPanel(), { wrapper: WebPart })
  return { result, context, portalDataService }
}

beforeEach(() => startTestTelemetry())

describe('useViewFormPanel (aggregated overview)', () => {
  it('cannot save a view without a name', () => {
    const { result } = formHook(false)
    expect(result.current.isEditing).toBe(false)
    expect(result.current.onSave).toBeUndefined()
  })

  it('adds a new view with the columns of the view it was made from, and closes the form with it', async () => {
    const { result, context, portalDataService } = formHook(false)
    act(() => result.current.setView('title', 'Mine leveranser'))
    await act(() => result.current.onSave())
    expect(portalDataService.addItemToList).toHaveBeenCalledWith('DATA_SOURCES', {
      Title: 'Mine leveranser',
      GtSearchQuery: QUERY,
      GtIconName: 'AppsList',
      GtProjectContentColumnsId: [2, 3],
      GtProjectContentRefinersId: [3],
      GtProjectContentGroupById: 3,
      GtDataSourceCategory: 'Leveranser',
      GtDataSourceLevel: ['Portefølje']
    })
    const [[action]] = context.dispatch.mock.calls
    expect(action.type).toBe(SET_VIEW_FORM_PANEL.type)
    expect(action.payload).toMatchObject({
      isOpen: false,
      submitAction: 'add',
      view: { id: 9, title: 'Mine leveranser' }
    })
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
  })

  it('updates the view it edits, and closes the form with it', async () => {
    const { result, context, portalDataService } = formHook(true)
    expect(result.current.isEditing).toBe(true)
    act(() => result.current.setView('title', 'Alle leveranser i porteføljen'))
    await act(() => result.current.onSave())
    expect(portalDataService.updateItemInList).toHaveBeenCalledWith(
      'DATA_SOURCES',
      1,
      expect.objectContaining({ Title: 'Alle leveranser i porteføljen', GtSearchQuery: QUERY })
    )
    const [[action]] = context.dispatch.mock.calls
    expect(action.payload).toMatchObject({
      isOpen: false,
      submitAction: 'edit',
      view: { id: 1, title: 'Alle leveranser i porteføljen' }
    })
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
  })

  it('throws a save the list refuses on, and counts it once by what the list answered', async () => {
    const { result, context, portalDataService } = formHook(true)
    portalDataService.updateItemInList.mockImplementationOnce(() =>
      Promise.reject(Object.assign(new Error('Ingen tilgang'), { status: 403 }))
    )
    let thrown: Error
    await act(() => result.current.onSave().catch((error) => (thrown = error)))
    // The error thrown on keeps the text of the answer, and not its status.
    expect(thrown.message).toContain('Ingen tilgang')
    expect(thrown).not.toHaveProperty('status')
    expect(context.dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry().errors).toEqual({
      'PortfolioAggregationWebPart permission_denied 403': 1
    })
  })

  it('closes the form when it is dismissed', () => {
    const { result, context } = formHook(false)
    result.current.onDismiss()
    expect(context.dispatch).toHaveBeenCalledWith(SET_VIEW_FORM_PANEL({ isOpen: false }))
  })
})
