// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The render mode field has tests of its own; here it renders
// nothing. The form's own hook is the real one, as are its footer and fields.
jest.mock('pp365-shared-library/lib/components/ItemColumn/ColumnDataTypeField', () => ({
  ColumnDataTypeField: () => null
}))

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectColumn, format } from 'pp365-shared-library'
import * as React from 'react'
import { PortfolioOverviewContext } from '../context'
import { ColumnFormPanel } from './index'

/**
 * The portfolio overview's column form with its own hook: an existing column's values show once it
 * has arrived, which the form reads after it opens; a save keeps what the form does not edit; and a
 * new column cannot take a managed property another column of the list shows already.
 */
const projectNumber = () =>
  new ProjectColumn({
    Id: 7,
    Title: 'Prosjektnummer',
    GtInternalName: 'GtProjectNumber',
    GtManagedProperty: 'GtProjectNumberOWSTEXT',
    GtSortOrder: 30,
    GtFieldDataType: 'Text',
    GtShowFieldProjectStatus: true,
    GtShowFieldPortfolio: true,
    GtIsRefinable: true,
    GtIsGroupable: true,
    GtColMinWidth: 120,
    GtFieldCustomSort: 'Etter serie:A,B,C',
    GtFieldOverrides: '{"Programmal":{"Prosjektnummer":{"displayName":"Programnummer"}}}'
  }).setData({ config: { A: { color: '#00ff00' } } as any })

const deletedColumn = () =>
  new ProjectColumn({
    Id: 9,
    Title: 'Gammel kolonne',
    GtInternalName: 'GtOld',
    GtManagedProperty: 'GtOldOWSTEXT',
    GtSortOrder: 90
  })

function renderForm(columnForm: Record<string, any>) {
  const dispatch = jest.fn()
  const updateItemInList = jest.fn().mockResolvedValue({})
  render(
    <PortfolioOverviewContext.Provider
      value={
        {
          state: { columnForm, columns: [], managedProperties: [], deletedColumnIds: [9] },
          props: {
            configuration: { columns: [projectNumber(), deletedColumn()] },
            dataAdapter: { portalDataService: { updateItemInList } }
          },
          dispatch
        } as any
      }
    >
      <ColumnFormPanel />
    </PortfolioOverviewContext.Provider>
  )
  return { dispatch, updateItemInList }
}

/** What React and Fluent said about inputs switching between controlled and uncontrolled. */
const controlWarnings = (consoleError: jest.SpyInstance) =>
  consoleError.mock.calls
    .map((args) => args.join(' '))
    .filter((text) =>
      /either controlled or uncontrolled|is changing an? (un)?controlled/.test(text)
    )

const field = (label: string) => screen.getByLabelText(label, { exact: false })

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('ColumnFormPanel (portfolio overview) with its own hook', () => {
  it("shows an existing column's visibility and switches, which arrive after the form opens", () => {
    renderForm({ isOpen: true, column: projectNumber() })
    // A multiselect combobox shows only its placeholder by itself: the pages are its value.
    expect(field(strings.ColumnVisibilityLabel)).toHaveValue(
      `${strings.ShowFieldProjectStatusLabel}, ${strings.ShowFieldPortfolioLabel}`
    )
    expect(field(strings.IsRefinableLabel)).toBeChecked()
    expect(field(strings.IsGroupableLabel)).toBeChecked()
  })

  it('shows the numbers the column has, and an empty max width it is not told', () => {
    // The max width showed 120, a default the form neither had from the column nor saved.
    const consoleError = jest.spyOn(console, 'error')
    renderForm({ isOpen: true, column: projectNumber() })
    expect(field(strings.SortOrderLabel)).toHaveValue(30)
    expect(field(strings.MinWidthLabel)).toHaveValue(120)
    expect(field(strings.MaxWidthLabel)).toHaveValue(null)
    expect(controlWarnings(consoleError)).toEqual([])
    consoleError.mockRestore()
  })

  it('keeps what the form does not edit in the column it saves, and writes no max width it did not show', async () => {
    // Made afresh from the saved fields, the column lost its configuration, custom sorts and field
    // overrides, and «Grupper etter» was off, until the page was loaded again.
    const { dispatch, updateItemInList } = renderForm({ isOpen: true, column: projectNumber() })
    fireEvent.change(field(strings.DisplayNameLabel), { target: { value: 'Nummer' } })
    fireEvent.click(screen.getByText(strings.SaveButtonLabel).closest('button'))
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'COLUMN_FORM_PANEL_ON_SAVED' })
      )
    )
    expect(updateItemInList.mock.calls[0][2].GtColMaxWidth).toBeUndefined()
    const { column, isNew } = dispatch.mock.calls.find(
      ([action]) => action.type === 'COLUMN_FORM_PANEL_ON_SAVED'
    )[0].payload
    expect(isNew).toBe(false)
    expect(column).toBeInstanceOf(ProjectColumn)
    expect(column.id).toBe(7)
    expect(column.name).toBe('Nummer')
    expect(column.data.isGroupable).toBe(true)
    expect(column.data.customSorts).toEqual(projectNumber().data.customSorts)
    expect(column.data.config).toEqual({ A: { color: '#00ff00' } })
    expect(column.data.fieldOverrides).toEqual(projectNumber().data.fieldOverrides)
  })

  it('refuses a new column on a managed property another column shows, and says which (WCAG 3.3.1)', () => {
    renderForm({ isOpen: true })
    fireEvent.change(field(strings.InternalNameLabel), { target: { value: 'GtProjectNumber2' } })
    fireEvent.change(field(strings.DisplayNameLabel), { target: { value: 'Nummer' } })
    // Search ignores the case of a managed property's name.
    fireEvent.change(field(strings.SearchPropertyLabel), {
      target: { value: 'gtprojectnumberowstext' }
    })
    const message = format(strings.SearchPropertyInUseMessage, 'Prosjektnummer')
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(field(strings.SearchPropertyLabel)).toHaveAttribute('aria-invalid', 'true')
    const save = screen.getByText(strings.SaveButtonLabel).closest('button')
    expect(save).toHaveAttribute('aria-disabled', 'true')
    expect(save).toHaveAttribute('title', message)
    // A column deleted since the page loaded leaves its property free, though the list read then
    // still has it.
    fireEvent.change(field(strings.SearchPropertyLabel), { target: { value: 'GtOldOWSTEXT' } })
    expect(screen.queryByText(message)).toBeNull()
    expect(field(strings.SearchPropertyLabel)).not.toHaveAttribute('aria-invalid', 'true')
    expect(save).not.toHaveAttribute('aria-disabled', 'true')
  })
})
