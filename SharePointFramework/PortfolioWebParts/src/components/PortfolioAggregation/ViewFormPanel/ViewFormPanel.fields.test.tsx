import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { DataSource } from 'pp365-shared-library'
import * as React from 'react'
import { PortfolioAggregationContext } from '../context'
import { ViewFormPanel } from './index'

/**
 * The aggregated overview's view form with its own hook: editing the current view says so in its
 * heading, and the search query shows the view being edited, which arrives after the form opens,
 * then follows what is typed.
 */
const QUERY_CURRENT =
  'ContentTypeId:0x010088578E7470CC4AA68D5663464831070209* GtDeliveryStatusOWSCHCS:*'
const QUERY_EDITED =
  'ContentTypeId:0x010088578E7470CC4AA68D5663464831070209* GtDeliveryEndTimeOWSDATE>{Today}'

function renderForm() {
  const current = new DataSource({ Id: 1, Title: 'Alle leveranser', GtSearchQuery: QUERY_CURRENT })
  const edited = new DataSource({
    Id: 2,
    Title: 'Kommende leveranser',
    GtSearchQuery: QUERY_EDITED
  })
  const contextFor = (viewForm: Record<string, any>) =>
    ({
      state: { viewForm, currentView: current },
      props: { dataSourceCategory: 'Leveranser', configuration: { level: 'Portefølje' } },
      dispatch: jest.fn()
    }) as any
  const ui = (viewForm: Record<string, any>) => (
    <PortfolioAggregationContext.Provider value={contextFor(viewForm)}>
      <ViewFormPanel />
    </PortfolioAggregationContext.Provider>
  )
  const { rerender } = render(ui({ isOpen: true, view: edited }))
  return { newView: () => rerender(ui({ isOpen: true })) }
}

const field = (label: string) => screen.getByLabelText(label, { exact: false })

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('ViewFormPanel (aggregated overview) with its own hook', () => {
  it('heads the form for the view edited as such and shows its search query, then those of a new view', () => {
    const { newView } = renderForm()
    expect(screen.getByText(strings.EditViewHeaderText)).toBeInTheDocument()
    expect(screen.queryByText(strings.NewViewHeaderText)).toBeNull()
    expect(field(strings.SearchQueryLabel)).toHaveValue(QUERY_EDITED)
    // The view has no icon: the field is empty, not the new view's icon left in it.
    expect(field(strings.IconNameLabel)).toHaveValue('')
    fireEvent.change(field(strings.SearchQueryLabel), { target: { value: 'Endret spørring' } })
    expect(field(strings.SearchQueryLabel)).toHaveValue('Endret spørring')
    newView()
    // A new view starts from the current one's search query.
    expect(screen.getByText(strings.NewViewHeaderText)).toBeInTheDocument()
    expect(field(strings.SearchQueryLabel)).toHaveValue(QUERY_CURRENT)
  })

  it('opens a data source saved without a search query, with save disabled until it has one', () => {
    // The form failed as it opened: save's check read the missing query's length.
    const edited = new DataSource({ Id: 4, Title: 'Uten spørring', GtSearchQuery: null })
    render(
      <PortfolioAggregationContext.Provider
        value={
          {
            state: { viewForm: { isOpen: true, view: edited }, currentView: edited },
            props: { dataSourceCategory: 'Leveranser', configuration: { level: 'Portefølje' } },
            dispatch: jest.fn()
          } as any
        }
      >
        <ViewFormPanel />
      </PortfolioAggregationContext.Provider>
    )
    expect(field(strings.SearchQueryLabel)).toHaveValue('')
    expect(screen.getByText(strings.SaveButtonLabel).closest('button')).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })
})
