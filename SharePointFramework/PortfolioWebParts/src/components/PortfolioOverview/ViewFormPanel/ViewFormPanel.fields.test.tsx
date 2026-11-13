import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { announced } from 'pp365-jest-config/lib/announce'
import { PortfolioOverviewView } from 'pp365-shared-library'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { PortfolioOverviewContext } from '../context'
import { ViewFormPanel } from './ViewFormPanel'

/**
 * The portfolio view form with its own hook: the fields show the view being edited, which arrives
 * after the form opens, not the new view the form starts from (its sort order one past the current
 * view's), and they follow what is typed. A save the list refuses is told in the form, which stays
 * open with what was typed, and counted once by its error code.
 */
const QUERY_CURRENT = 'ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C* GtIsProgramOWSBOOL:0'
const QUERY_EDITED =
  'ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C* GtIsParentProjectOWSBOOL:1'

const view = (Id: number, Title: string, GtSortOrder: number, GtSearchQuery: string, extra = {}) =>
  new PortfolioOverviewView({ Id, Title, GtSortOrder, GtSearchQuery, ...extra })

function renderForm() {
  const current = view(1, 'Alle prosjekter', 20, QUERY_CURRENT)
  const edited = view(3, 'Overordnede prosjekter', 11, QUERY_EDITED, {
    GtPortfolioIsDefaultView: true,
    GtPortfolioIsPersonalView: false
  })
  const contextFor = (viewForm: Record<string, any>) =>
    ({
      state: { viewForm, currentView: current },
      props: { configuration: { views: [current, edited] } },
      dispatch: jest.fn()
    }) as any
  const ui = (viewForm: Record<string, any>) => (
    <PortfolioOverviewContext.Provider value={contextFor(viewForm)}>
      <ViewFormPanel />
    </PortfolioOverviewContext.Provider>
  )
  const { rerender } = render(ui({ isOpen: true, view: edited }))
  return { newView: () => rerender(ui({ isOpen: true })) }
}

const field = (label: string) => screen.getByLabelText(label, { exact: false })

beforeEach(() => startTestTelemetry())

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('ViewFormPanel (portfolio overview) with its own hook', () => {
  it('shows the sort order, search query and switches of the view edited, then of a new view', () => {
    const { newView } = renderForm()
    expect(field(strings.SortOrderLabel)).toHaveValue(11)
    expect(field(strings.SearchQueryLabel)).toHaveValue(QUERY_EDITED)
    expect(field(strings.DefaultViewLabel)).toBeChecked()
    expect(field(strings.PersonalViewLabel)).not.toBeChecked()
    // The view has no icon: the field is empty, not the new view's icon left in it.
    expect(field(strings.IconNameLabel)).toHaveValue('')
    fireEvent.change(field(strings.SearchQueryLabel), { target: { value: 'Endret spørring' } })
    expect(field(strings.SearchQueryLabel)).toHaveValue('Endret spørring')
    newView()
    // A new view follows the current one: one past its sort order, its search query, personal.
    expect(field(strings.SortOrderLabel)).toHaveValue(21)
    expect(field(strings.SearchQueryLabel)).toHaveValue(QUERY_CURRENT)
    expect(field(strings.DefaultViewLabel)).not.toBeChecked()
    expect(field(strings.PersonalViewLabel)).toBeChecked()
  })

  it('opens a view saved without a search query, with save disabled until it has one', () => {
    // The form failed as it opened: save's check read the missing query's length.
    const edited = new PortfolioOverviewView({
      Id: 4,
      Title: 'Uten spørring',
      GtSortOrder: 30,
      GtSearchQuery: null
    })
    render(
      <PortfolioOverviewContext.Provider
        value={
          {
            state: { viewForm: { isOpen: true, view: edited }, currentView: edited },
            props: { configuration: { views: [edited] } },
            dispatch: jest.fn()
          } as any
        }
      >
        <ViewFormPanel />
      </PortfolioOverviewContext.Provider>
    )
    expect(field(strings.SearchQueryLabel)).toHaveValue('')
    expect(screen.getByText(strings.SaveButtonLabel).closest('button')).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('says that the view could not be saved when the list refuses it, and keeps what was typed (WCAG 3.3.1, 4.1.3)', async () => {
    // The form did nothing: the refusal went to the save button's click, unhandled.
    const edited = view(3, 'Overordnede prosjekter', 11, QUERY_EDITED)
    const dispatch = jest.fn()
    const updateItemInList = jest
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('Ingen tilgang'), { status: 403 }))
      .mockResolvedValue(undefined)
    render(
      <AriaLiveAnnouncer>
        <TelemetryProvider component='PortfolioOverviewWebPart'>
          <PortfolioOverviewContext.Provider
            value={
              {
                state: { viewForm: { isOpen: true, view: edited }, currentView: edited },
                props: {
                  configuration: { views: [edited] },
                  dataAdapter: { portalDataService: { updateItemInList } }
                },
                dispatch
              } as any
            }
          >
            <ViewFormPanel />
          </PortfolioOverviewContext.Provider>
        </TelemetryProvider>
      </AriaLiveAnnouncer>
    )
    const save = () => fireEvent.click(screen.getByText(strings.SaveButtonLabel).closest('button'))
    fireEvent.change(field(strings.TitleLabel), { target: { value: 'Overordnede' } })
    save()
    expect(await screen.findByText(strings.ViewSaveErrorText)).toBeInTheDocument()
    expect(screen.getByText(strings.ErrorTitle)).toBeInTheDocument()
    await waitFor(() => expect(announced()).toContain(strings.ViewSaveErrorText))
    expect(field(strings.TitleLabel)).toHaveValue('Overordnede')
    expect(dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: { 'PortfolioOverviewWebPart permission_denied 403': 1 },
      timings: {}
    })

    // A save the list takes clears the message, counts the view as saved and closes the form.
    save()
    await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(2))
    expect(screen.queryByText(strings.ViewSaveErrorText)).toBeNull()
    expect(updateItemInList).toHaveBeenLastCalledWith(
      'PORTFOLIO_VIEWS',
      3,
      expect.objectContaining({ Title: 'Overordnede' })
    )
    expect(countedTelemetry()).toEqual({
      usage: { 'PortfolioOverviewWebPart view.saved': 1 },
      errors: { 'PortfolioOverviewWebPart permission_denied 403': 1 },
      timings: {}
    })
  })
})
