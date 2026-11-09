// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The search property's combobox is a stand-in: it has tests of its
// own. The form, its hook and the data type field are the real ones.
jest.mock('pp365-shared-library', () => {
  const React = jest.requireActual('react')
  return {
    ...jest.requireActual('pp365-shared-library'),
    ColumnSearchPropertyField: ({ disabled, readOnly }: any) =>
      React.createElement('input', {
        disabled,
        readOnly,
        defaultValue: 'GtDeliveryEndTimeOWSDATE'
      })
  }
})

import { render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import {
  ColumnRenderComponentRegistry,
  ProjectContentColumn,
  useColumnRenderComponentRegistry
} from 'pp365-shared-library'
import * as React from 'react'
import { PortfolioAggregationContext } from '../context'
import { ColumnFormPanel } from './ColumnFormPanel'

/**
 * «Rediger kolonne» in the aggregated overview, with the form's own hook: the form gets the column
 * it edits after its first render. Before 1.15.0 shipped, the data type dropdown kept that first
 * render's empty state, and a save sent the type as the column's lower-case key.
 */
const column = new ProjectContentColumn({
  Id: 3,
  Title: 'Sluttidspunkt',
  GtInternalName: 'GtDeliveryEndTime',
  GtManagedProperty: 'GtDeliveryEndTimeOWSDATE',
  GtFieldDataType: 'Date',
  GtDataSourceCategory: 'Leveranseoversikt',
  GtSortOrder: 120,
  GtColMinWidth: 120,
  GtColMaxWidth: 200
} as any)

function renderForm(updateProjectContentColumn: jest.Mock) {
  render(
    <PortfolioAggregationContext.Provider
      value={
        {
          state: { columnForm: { isOpen: true, column } },
          props: {
            dataSourceCategory: 'Leveranseoversikt',
            dataAdapter: { portalDataService: { updateProjectContentColumn } }
          },
          dispatch: jest.fn()
        } as any
      }
    >
      <ColumnFormPanel />
    </PortfolioAggregationContext.Provider>
  )
}

describe('ColumnFormPanel (aggregated overview), editing a column', () => {
  beforeAll(() => {
    // The aggregated overview fills the renderer registry long before the form opens.
    renderHook(() => useColumnRenderComponentRegistry())
  })

  it("shows the column's own data type", async () => {
    renderForm(jest.fn())
    expect(
      await screen.findByRole('combobox', { name: new RegExp(strings.ColumnRenderLabel) })
    ).toHaveTextContent(ColumnRenderComponentRegistry.getOption('date').text)
  })

  it('saves the data type by its stored id', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const updateProjectContentColumn = jest.fn().mockResolvedValue({})
    renderForm(updateProjectContentColumn)
    await screen.findByRole('combobox', { name: new RegExp(strings.ColumnRenderLabel) })
    await user.click(screen.getByRole('button', { name: strings.SaveButtonLabel }))
    await waitFor(() =>
      expect(updateProjectContentColumn).toHaveBeenCalledWith(
        'PROJECT_CONTENT_COLUMNS',
        expect.objectContaining({ Id: 3, GtFieldDataType: 'Date' }),
        false
      )
    )
  })
})
