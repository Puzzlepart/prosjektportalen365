// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The render mode field has tests of its own; here it renders
// nothing. The form's own hook is the real one, as are its footer and fields.
jest.mock('pp365-shared-library/lib/components/ItemColumn/ColumnDataTypeField', () => ({
  ColumnDataTypeField: () => null
}))

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectColumn, format } from 'pp365-shared-library'
import * as React from 'react'
import { PortfolioOverviewContext } from '../context'
import { ColumnFormPanel } from './index'

/**
 * The portfolio overview's column form with its own hook: an existing column's values show once it
 * has arrived, which the form reads after it opens; a save keeps what the form does not edit and
 * writes no value the user did not give; the title column cannot be deleted, and a delete the list
 * refused is told; and a new column cannot take a managed property another column of the list
 * shows already.
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

/** A column without a minimum width of its own: the model gives it 100. */
const phase = () =>
  new ProjectColumn({
    Id: 8,
    Title: 'Fase',
    GtInternalName: 'GtProjectPhase',
    GtManagedProperty: 'GtProjectPhaseOWSCHCS',
    GtSortOrder: 40,
    GtShowFieldPortfolio: true,
    // SharePoint gives an empty number as null.
    GtColMinWidth: null
  })

const title = () =>
  new ProjectColumn({
    Id: 1,
    Title: 'Tittel',
    GtInternalName: 'Title',
    GtManagedProperty: 'Title',
    GtSortOrder: 10,
    GtShowFieldPortfolio: true
  })

const deletedColumn = () =>
  new ProjectColumn({
    Id: 9,
    Title: 'Gammel kolonne',
    GtInternalName: 'GtOld',
    GtManagedProperty: 'GtOldOWSTEXT',
    GtSortOrder: 90
  })

function renderForm(columnForm: Record<string, any>, isDeleted = true) {
  const dispatch = jest.fn()
  const updateItemInList = jest.fn().mockResolvedValue({})
  const deleteItemFromList = jest.fn().mockResolvedValue(isDeleted)
  render(
    <PortfolioOverviewContext.Provider
      value={
        {
          state: { columnForm, columns: [], managedProperties: [], deletedColumnIds: [9] },
          props: {
            configuration: { columns: [projectNumber(), deletedColumn()] },
            dataAdapter: { portalDataService: { updateItemInList, deleteItemFromList } }
          },
          dispatch
        } as any
      }
    >
      <ColumnFormPanel />
    </PortfolioOverviewContext.Provider>
  )
  return { dispatch, updateItemInList, deleteItemFromList }
}

/** What React and Fluent said about inputs switching between controlled and uncontrolled. */
const controlWarnings = (consoleError: jest.SpyInstance) =>
  consoleError.mock.calls
    .map((args) => args.join(' '))
    .filter((text) =>
      /either controlled or uncontrolled|is changing an? (un)?controlled/.test(text)
    )

const field = (label: string) => screen.getByLabelText(label, { exact: false })
const button = (text: string) => screen.getByText(text).closest('button')

/** Saves the form, and waits for the column it saved. */
async function save(dispatch: jest.Mock) {
  const saves = dispatch.mock.calls.length
  fireEvent.click(button(strings.SaveButtonLabel))
  await waitFor(() => expect(dispatch.mock.calls.length).toBeGreaterThan(saves))
}

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

  it('shows the numbers the column has, and no max width, which the overview does not use', () => {
    // The max width showed 120, a default the form neither had from the column nor saved, and the
    // overview's list sizes a column by its minimum width alone.
    const consoleError = jest.spyOn(console, 'error')
    renderForm({ isOpen: true, column: projectNumber() })
    expect(field(strings.SortOrderLabel)).toHaveValue(30)
    expect(field(strings.MinWidthLabel)).toHaveValue(120)
    expect(screen.queryByLabelText(strings.MaxWidthLabel, { exact: false })).toBeNull()
    expect(controlWarnings(consoleError)).toEqual([])
    consoleError.mockRestore()
  })

  it('leaves a minimum width the column did not have out of a save, and sends one the user gave', async () => {
    // The form showed the model's 100 and saved it, where the list had none.
    const { dispatch, updateItemInList } = renderForm({ isOpen: true, column: phase() })
    expect(field(strings.MinWidthLabel)).toHaveValue(100)
    await save(dispatch)
    expect(updateItemInList.mock.calls[0][2]).not.toHaveProperty('GtColMinWidth')
    expect(updateItemInList.mock.calls[0][2]).not.toHaveProperty('GtColMaxWidth')
    fireEvent.change(field(strings.MinWidthLabel), { target: { value: '150' } })
    await save(dispatch)
    expect(updateItemInList.mock.calls[1][2].GtColMinWidth).toBe(150)
  })

  it('keeps the title column from being deleted, saying why (WCAG 3.3.2)', () => {
    renderForm({ isOpen: true, column: title() })
    expect(button(strings.DeleteButtonLabel)).toHaveAttribute('aria-disabled', 'true')
    expect(button(strings.DeleteButtonLabel)).toHaveAttribute(
      'title',
      strings.TitleColumnDeleteDisabledReason
    )
  })

  it('says so when the list refused to delete the column (WCAG 3.3.1)', async () => {
    // The form did nothing: the column stayed, without a word of why.
    const { dispatch, deleteItemFromList } = renderForm(
      { isOpen: true, column: projectNumber() },
      false
    )
    fireEvent.click(button(strings.DeleteButtonLabel))
    const question = await screen.findByText(strings.ConfirmDeleteProjectColumnSubText)
    fireEvent.click(
      within(question.closest('[role="dialog"]') as HTMLElement).getByText(
        strings.ConfirmDeleteResponseConfirm
      )
    )
    expect(await screen.findByText(strings.ColumnDeleteErrorText)).toBeInTheDocument()
    expect(deleteItemFromList).toHaveBeenCalledWith('PROJECT_COLUMNS', 7)
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'COLUMN_DELETED' }))
  })

  it('keeps what the form does not edit in the column it saves', async () => {
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
    expect(updateItemInList.mock.calls[0][2]).not.toHaveProperty('GtColMaxWidth')
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
