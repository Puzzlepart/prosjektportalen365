// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The search property's combobox is a stand-in: it has tests of its
// own. The form, its hook and the data type field are the real ones.
jest.mock('pp365-shared-library', () => {
  const React = jest.requireActual('react')
  return {
    ...jest.requireActual('pp365-shared-library'),
    ColumnSearchPropertyField: ({ disabled, readOnly }: any) =>
      React.createElement('input', { disabled, readOnly, defaultValue: 'GtProjectProgressOWSNMBR' })
  }
})

import { render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import {
  ColumnRenderComponentRegistry,
  ProjectColumn,
  useColumnRenderComponentRegistry
} from 'pp365-shared-library'
import * as React from 'react'
import { PortfolioOverviewContext } from '../context'
import { ColumnFormPanel } from './index'

/**
 * «Rediger kolonne» in the portfolio overview, with the form's own hook: the form gets the column
 * it edits after its first render. Before 1.15.0 shipped, the data type dropdown kept that first
 * render's empty state, and saving any edit stored the column as text.
 */
const column = new ProjectColumn({
  Id: 7,
  Title: 'Fremdrift',
  GtInternalName: 'GtProjectProgress',
  GtManagedProperty: 'GtProjectProgressOWSNMBR',
  GtFieldDataType: 'Percentage',
  GtSortOrder: 200,
  GtColMinWidth: 100,
  GtShowFieldPortfolio: true
} as any)

function renderForm(updateItemInList: jest.Mock) {
  render(
    <PortfolioOverviewContext.Provider
      value={
        {
          state: { columnForm: { isOpen: true, column }, managedProperties: [] },
          props: { dataAdapter: { portalDataService: { updateItemInList } } },
          dispatch: jest.fn()
        } as any
      }
    >
      <ColumnFormPanel />
    </PortfolioOverviewContext.Provider>
  )
}

describe('ColumnFormPanel (portfolio overview), editing a column', () => {
  beforeAll(() => {
    // The portfolio overview fills the renderer registry long before the form opens.
    renderHook(() => useColumnRenderComponentRegistry())
  })

  it("shows the column's own data type", async () => {
    renderForm(jest.fn())
    expect(
      await screen.findByRole('combobox', { name: new RegExp(strings.ColumnRenderLabel) })
    ).toHaveTextContent(ColumnRenderComponentRegistry.getOption('percentage').text)
  })

  it('keeps the data type when another property is saved', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const updateItemInList = jest.fn().mockResolvedValue({})
    renderForm(updateItemInList)
    await screen.findByRole('combobox', { name: new RegExp(strings.ColumnRenderLabel) })
    await user.click(screen.getByRole('button', { name: strings.SaveButtonLabel }))
    await waitFor(() =>
      expect(updateItemInList).toHaveBeenCalledWith(
        'PROJECT_COLUMNS',
        7,
        expect.objectContaining({ GtFieldDataType: 'Percentage' })
      )
    )
  })
})
