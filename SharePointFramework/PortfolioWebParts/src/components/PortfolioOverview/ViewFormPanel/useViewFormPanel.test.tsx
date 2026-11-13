import { act, renderHook } from '@testing-library/react'
import { PortfolioOverviewView } from 'pp365-shared-library'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import React, { FC, PropsWithChildren } from 'react'
import { PortfolioOverviewContext } from '../context'
import { CHANGE_VIEW, SET_VIEW_FORM_PANEL } from '../reducer'
import { useViewFormPanel } from './useViewFormPanel'

/**
 * Saving a view of the portfolio overview: a new view is added to the views list with the
 * columns of the view it was made from, an edited one is updated; either is shown and the form
 * closes. A view the list has taken is counted as saved, once, for the web part the overview is
 * in; one the list refuses is not, and the form stays open.
 */
const QUERY = 'DepartmentId:{5c7d2f6a-3b1e-4d8c-9a0f-6e2b1c4d7f80} contentclass:STS_Site'

function currentView() {
  return new PortfolioOverviewView({
    Id: 7,
    Title: 'Alle prosjekter',
    GtSearchQuery: QUERY,
    GtSortOrder: 10,
    GtPortfolioColumnsId: [1, 2],
    GtPortfolioRefinersId: [2],
    GtPortfolioGroupById: 2
  }).configure([])
}

/**
 * The form's hook in an overview that shows `Alle prosjekter`, open for a new view or to edit the
 * one shown.
 *
 * @param isEditing Whether the form edits the view shown
 * @param alias The alias of the web part the overview is in
 */
function formHook(isEditing: boolean, alias = 'PortfolioOverviewWebPart') {
  const view = currentView()
  const portalDataService = {
    updateItemInList: jest.fn((..._args: unknown[]) => Promise.resolve()),
    addItemToList: jest.fn((..._args: unknown[]) => Promise.resolve({ Id: 12 }))
  }
  const context = {
    props: { dataAdapter: { portalDataService }, configuration: { views: [view] } },
    state: { currentView: view, viewForm: isEditing ? { isOpen: true, view } : { isOpen: true } },
    dispatch: jest.fn()
  } as any
  const WebPart: FC<PropsWithChildren> = ({ children }) => (
    <TelemetryProvider component={alias}>
      <PortfolioOverviewContext.Provider value={context}>
        {children}
      </PortfolioOverviewContext.Provider>
    </TelemetryProvider>
  )
  const { result } = renderHook(() => useViewFormPanel(), { wrapper: WebPart })
  return { result, context, portalDataService }
}

/** The actions the hook dispatched, by their type. */
const dispatched = (context: any) => context.dispatch.mock.calls.map(([action]) => action.type)

beforeEach(() => startTestTelemetry())

describe('useViewFormPanel (portfolio overview)', () => {
  it('cannot save a view without a name', () => {
    const { result } = formHook(false)
    expect(result.current.isEditing).toBe(false)
    expect(result.current.onSave).toBeUndefined()
  })

  it('adds a new view with the columns of the view it was made from, shows it and counts it as saved', async () => {
    const { result, context, portalDataService } = formHook(false)
    act(() => result.current.setView('title', 'Mine prosjekter'))
    await act(() => result.current.onSave())
    expect(portalDataService.addItemToList).toHaveBeenCalledWith(
      'PORTFOLIO_VIEWS',
      expect.objectContaining({
        Title: 'Mine prosjekter',
        GtSearchQuery: QUERY,
        GtPortfolioColumnsId: [1, 2],
        GtPortfolioRefinersId: [2],
        GtPortfolioGroupById: 2
      })
    )
    expect(context.props.configuration.views.map((v) => [v.id, v.title])).toEqual([
      [7, 'Alle prosjekter'],
      [12, 'Mine prosjekter']
    ])
    expect(dispatched(context)).toEqual([CHANGE_VIEW.type, SET_VIEW_FORM_PANEL.type])
    expect(context.dispatch).toHaveBeenLastCalledWith(SET_VIEW_FORM_PANEL({ isOpen: false }))
    expect(countedTelemetry().usage).toEqual({ 'PortfolioOverviewWebPart view.saved': 1 })
  })

  it('updates the view it edits, in the list and among the views, and counts it as saved', async () => {
    const { result, context, portalDataService } = formHook(true, 'ProgramProjectOverviewWebPart')
    expect(result.current.isEditing).toBe(true)
    act(() => result.current.setView('title', 'Alle prosjekter i porteføljen'))
    await act(() => result.current.onSave())
    expect(portalDataService.updateItemInList).toHaveBeenCalledWith(
      'PORTFOLIO_VIEWS',
      7,
      expect.objectContaining({ Title: 'Alle prosjekter i porteføljen', GtSearchQuery: QUERY })
    )
    expect(portalDataService.addItemToList).not.toHaveBeenCalled()
    expect(context.props.configuration.views.map((v) => [v.id, v.title])).toEqual([
      [7, 'Alle prosjekter i porteføljen']
    ])
    expect(dispatched(context)).toEqual([CHANGE_VIEW.type, SET_VIEW_FORM_PANEL.type])
    // The save is one event: the view it then shows is no switch of view.
    expect(countedTelemetry().usage).toEqual({ 'ProgramProjectOverviewWebPart view.saved': 1 })
  })

  it('counts no view as saved when the list refuses it, and leaves the form open', async () => {
    const { result, context, portalDataService } = formHook(true)
    portalDataService.updateItemInList.mockImplementationOnce(() =>
      Promise.reject(Object.assign(new Error('Ingen tilgang'), { status: 403 }))
    )
    let refusal: unknown
    await act(() => result.current.onSave().catch((error) => (refusal = error)))
    expect(refusal).toMatchObject({ status: 403 })
    expect(context.dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry().usage).toEqual({})
  })

  it('closes the form when it is dismissed', () => {
    const { result, context } = formHook(false)
    result.current.onDismiss()
    expect(context.dispatch).toHaveBeenCalledWith(SET_VIEW_FORM_PANEL({ isOpen: false }))
  })
})
