// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The render mode field has tests of its own; here it renders
// nothing. The form's own hook is the real one, as are its footer and fields.
jest.mock('pp365-shared-library/lib/components/ItemColumn/ColumnDataTypeField', () => ({
  ColumnDataTypeField: () => null
}))

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectContentColumn, format } from 'pp365-shared-library'
import * as React from 'react'
import { PortfolioAggregationContext } from '../context'
import { ColumnFormPanel } from './ColumnFormPanel'

/**
 * The aggregated overview's column form with its own hook: the fields show the values of the column
 * the form has, which arrives after the form opens; a save keeps what the form does not edit and
 * writes no minimum width the user did not give; a locked column cannot be deleted, and a delete
 * the list refused is told; and a new column cannot take a managed property another column of the
 * category shows already, the locked project column too.
 */
const column = (Id: number, Title: string, fieldName: string, extra: Record<string, any> = {}) =>
  new ProjectContentColumn({
    Id,
    Title,
    GtInternalName: fieldName,
    GtManagedProperty: fieldName,
    GtFieldDataType: 'Text',
    ...extra
  })

const title = () => column(1, 'Tittel', 'Title', { GtFieldLocked: true })
const project = () =>
  column(36, 'Prosjekt', 'SiteTitle', {
    GtFieldLocked: true,
    GtIsGroupable: true,
    GtSortOrder: 5,
    GtColMinWidth: 175,
    // SharePoint gives an empty number as null.
    GtColMaxWidth: null
  })
const status = () => column(40, 'Status', 'GtDeliveryStatusOWSCHCS', { GtIsGroupable: true })
const phase = () => column(42, 'Fase', 'GtDeliveryPhaseOWSCHCS', { GtIsGroupable: true })
const deleted = () => column(41, 'Gammel kolonne', 'GtOldOWSTEXT')

function renderForm(columnForm: Record<string, any>, isDeleted = true) {
  const dispatch = jest.fn()
  const updateProjectContentColumn = jest.fn().mockResolvedValue({})
  const deleteItemFromList = jest.fn().mockResolvedValue(isDeleted)
  const ui = (form: Record<string, any>) => (
    <PortfolioAggregationContext.Provider
      value={
        {
          // A project-level data source leaves the project column out of the category's columns.
          state: {
            columnForm: form,
            columns: [title(), status()],
            allColumnsForCategory: [title(), status()],
            deletedColumnIds: [41]
          },
          props: {
            dataSourceCategory: 'Leveranser',
            configuration: { columns: [title(), project(), status(), deleted()] },
            dataAdapter: { portalDataService: { updateProjectContentColumn, deleteItemFromList } }
          },
          dispatch
        } as any
      }
    >
      <ColumnFormPanel />
    </PortfolioAggregationContext.Provider>
  )
  const { rerender } = render(ui(columnForm))
  return {
    open: (form: Record<string, any>) => rerender(ui(form)),
    dispatch,
    updateProjectContentColumn,
    deleteItemFromList
  }
}

const field = (label: string) => screen.getByLabelText(label, { exact: false })
const button = (text: string) => screen.getByText(text).closest('button')

/** Saves the form, and waits for the column it saved. */
async function save(dispatch: jest.Mock) {
  const saves = dispatch.mock.calls.length
  fireEvent.click(button(strings.SaveButtonLabel))
  await waitFor(() => expect(dispatch.mock.calls.length).toBeGreaterThan(saves))
}

/** What React and Fluent said about inputs switching between controlled and uncontrolled. */
const controlWarnings = (consoleError: jest.SpyInstance) =>
  consoleError.mock.calls
    .map((args) => args.join(' '))
    .filter((text) =>
      /either controlled or uncontrolled|is changing an? (un)?controlled/.test(text)
    )

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('ColumnFormPanel (aggregated overview) with its own hook', () => {
  it('shows whether the column it has can be grouped by, though the switch was used for another', () => {
    const { open } = renderForm({ isOpen: true, column: status() })
    expect(field(strings.IsGroupableLabel)).toBeChecked()
    // The switch kept what was done to it, and showed that for the next column the form got.
    fireEvent.click(field(strings.IsGroupableLabel))
    expect(field(strings.IsGroupableLabel)).not.toBeChecked()
    open({ isOpen: true, column: phase() })
    expect(field(strings.IsGroupableLabel)).toBeChecked()
  })

  it('shows the numbers the column has, and an empty max width for a column without one', () => {
    // The max width showed the new column's 150.
    const consoleError = jest.spyOn(console, 'error')
    renderForm({ isOpen: true, column: project() })
    expect(field(strings.SortOrderLabel)).toHaveValue(5)
    expect(field(strings.MinWidthLabel)).toHaveValue(175)
    expect(field(strings.MaxWidthLabel)).toHaveValue(null)
    expect(controlWarnings(consoleError)).toEqual([])
    consoleError.mockRestore()
  })

  it('keeps what the form does not edit in the column it saves, the lock among it, and writes back the max width it has', async () => {
    // Made afresh from the saved fields, the column lost its lock and «Grupper etter» was off,
    // until the page was loaded again.
    const { dispatch, updateProjectContentColumn } = renderForm({
      isOpen: true,
      column: project()
    })
    fireEvent.change(field(strings.DisplayNameLabel), { target: { value: 'Prosjektnavn' } })
    fireEvent.click(button(strings.SaveButtonLabel))
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'COLUMN_FORM_PANEL_ON_SAVED' })
      )
    )
    expect(updateProjectContentColumn.mock.calls[0][1].GtColMaxWidth).toBeNull()
    const { column: saved, isNew } = dispatch.mock.calls.find(
      ([action]) => action.type === 'COLUMN_FORM_PANEL_ON_SAVED'
    )[0].payload
    expect(isNew).toBe(false)
    expect(saved).toBeInstanceOf(ProjectContentColumn)
    expect(saved.id).toBe(36)
    expect(saved.name).toBe('Prosjektnavn')
    expect(saved.data.isLocked).toBe(true)
    expect(saved.isGroupable).toBe(true)
    expect(saved.data.isGroupable).toBe(true)
  })

  it('leaves a minimum width the column did not have out of a save, and sends one the user gave', async () => {
    // The form showed the model's 100 and saved it, where the list had none.
    const { dispatch, updateProjectContentColumn } = renderForm({
      isOpen: true,
      column: column(43, 'Ansvarlig', 'GtDeliveryOwnerOWSUSER', { GtColMinWidth: null })
    })
    expect(field(strings.MinWidthLabel)).toHaveValue(100)
    await save(dispatch)
    expect(updateProjectContentColumn.mock.calls[0][1].GtColMinWidth).toBeUndefined()
    fireEvent.change(field(strings.MinWidthLabel), { target: { value: '150' } })
    await save(dispatch)
    expect(updateProjectContentColumn.mock.calls[1][1].GtColMinWidth).toBe(150)
  })

  it('says so when the list refused to delete the column (WCAG 3.3.1)', async () => {
    // The form did nothing: the column stayed, without a word of why.
    const { dispatch, deleteItemFromList } = renderForm({ isOpen: true, column: status() }, false)
    fireEvent.click(button(strings.DeleteButtonLabel))
    const question = await screen.findByText(strings.ConfirmDeleteProjectContentColumnSubText)
    fireEvent.click(
      within(question.closest('[role="dialog"]') as HTMLElement).getByText(
        strings.ConfirmDeleteResponseConfirm
      )
    )
    expect(await screen.findByText(strings.ColumnDeleteErrorText)).toBeInTheDocument()
    expect(deleteItemFromList).toHaveBeenCalledWith('PROJECT_CONTENT_COLUMNS', 40)
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'COLUMN_DELETED' }))
  })

  it('keeps a locked column and the title column from being deleted, saying why (WCAG 3.3.2)', () => {
    // The project column could be deleted from its own column menu, through this form.
    const { open } = renderForm({ isOpen: true, column: project() })
    expect(button(strings.DeleteButtonLabel)).toHaveAttribute('aria-disabled', 'true')
    expect(button(strings.DeleteButtonLabel)).toHaveAttribute(
      'title',
      strings.LockedColumnDeleteDisabledReason
    )
    open({ isOpen: true, column: title() })
    expect(button(strings.DeleteButtonLabel)).toHaveAttribute(
      'title',
      strings.TitleColumnDeleteDisabledReason
    )
    open({ isOpen: true, column: status() })
    expect(button(strings.DeleteButtonLabel)).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('refuses a new column on a managed property another column shows, the locked project column too, and says which (WCAG 3.3.1)', () => {
    renderForm({ isOpen: true })
    fireEvent.change(field(strings.InternalNameLabel), { target: { value: 'SiteTitle2' } })
    fireEvent.change(field(strings.DisplayNameLabel), { target: { value: 'Prosjektnavn' } })
    fireEvent.change(field(strings.SearchPropertyLabel), { target: { value: 'SiteTitle' } })
    const message = format(strings.SearchPropertyInUseMessage, 'Prosjekt')
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(field(strings.SearchPropertyLabel)).toHaveAttribute('aria-invalid', 'true')
    const save = screen.getByText(strings.SaveButtonLabel).closest('button')
    expect(save).toHaveAttribute('aria-disabled', 'true')
    expect(save).toHaveAttribute('title', message)
    // Search ignores the case of a managed property's name, and the spaces around it.
    fireEvent.change(field(strings.SearchPropertyLabel), { target: { value: ' title ' } })
    expect(
      screen.getByText(format(strings.SearchPropertyInUseMessage, 'Tittel'))
    ).toBeInTheDocument()
    // A column deleted since the page loaded leaves its property free, though the configuration
    // read then still has it.
    fireEvent.change(field(strings.SearchPropertyLabel), { target: { value: 'GtOldOWSTEXT' } })
    expect(field(strings.SearchPropertyLabel)).not.toHaveAttribute('aria-invalid', 'true')
    expect(save).not.toHaveAttribute('aria-disabled', 'true')
  })
})
