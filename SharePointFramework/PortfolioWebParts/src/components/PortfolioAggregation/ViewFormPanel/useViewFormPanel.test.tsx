import { act, renderHook } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
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
 * with the view. A save the list refuses leaves the form open with what was typed and is told in
 * it, and counted once by what the list answered. The contract gives the aggregated overview no
 * event for a saved view, so a save counts none.
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

  it('tells of a save the list refuses and counts it once by what the list answered, with the form left open', async () => {
    // The refusal was thrown on to the save button's click, which shows no one anything.
    const { result, context, portalDataService } = formHook(true)
    portalDataService.updateItemInList.mockImplementationOnce(() =>
      Promise.reject(Object.assign(new Error('Ingen tilgang'), { status: 403 }))
    )
    act(() => result.current.setView('title', 'Alle leveranser i porteføljen'))
    await act(() => result.current.onSave())
    expect(result.current.saveError).toBe(strings.ViewSaveErrorText)
    expect(result.current.view.get('title')).toBe('Alle leveranser i porteføljen')
    expect(context.dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: { 'PortfolioAggregationWebPart permission_denied 403': 1 },
      timings: {}
    })

    // A save the list takes clears the message, and counts nothing more.
    await act(() => result.current.onSave())
    expect(result.current.saveError).toBeUndefined()
    expect(context.dispatch).toHaveBeenCalledTimes(1)
    expect(countedTelemetry().errors).toEqual({
      'PortfolioAggregationWebPart permission_denied 403': 1
    })
  })

  it('tells of a new view the list refuses in the same way', async () => {
    const { result, context, portalDataService } = formHook(false)
    portalDataService.addItemToList.mockImplementationOnce(() =>
      Promise.reject(Object.assign(new Error('Tjenesten svarer ikke'), { status: 503 }))
    )
    act(() => result.current.setView('title', 'Mine leveranser'))
    await act(() => result.current.onSave())
    expect(result.current.saveError).toBe(strings.ViewSaveErrorText)
    expect(context.dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: { 'PortfolioAggregationWebPart server_error 503': 1 },
      timings: {}
    })
  })

  it('closes the form when it is dismissed', () => {
    const { result, context } = formHook(false)
    result.current.onDismiss()
    expect(context.dispatch).toHaveBeenCalledWith(SET_VIEW_FORM_PANEL({ isOpen: false }))
  })
})
