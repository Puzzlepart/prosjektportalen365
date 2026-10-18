import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { EDIT_VIEW_COLUMNS_PANEL_DEFAULT_PROPS, EditViewColumnsPanel } from './EditViewColumnsPanel'
import { EditViewColumnsPanelSortMode } from './types'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'

/**
 * The show/hide columns panel: the selected columns first, in the view's order, then the rest;
 * choosing, unchoosing and moving columns; and what "use" hands back.
 */
const column = (
  id: number,
  fieldName: string,
  name: string,
  isSelected: boolean,
  data: Record<string, any> = {}
) =>
  ({
    key: fieldName,
    fieldName,
    name,
    minWidth: 100,
    id,
    sortOrder: id * 10,
    data: { isSelected, ...data }
  }) as any

const columns = () => [
  column(3, 'GtBudgetTotal', 'Budsjett', false),
  column(2, 'GtProjectPhase', 'Fase', true),
  column(1, 'Title', 'Tittel', true, { isLocked: true })
]

function renderPanel(props: Record<string, any> = {}) {
  const onSave = jest.fn()
  render(
    <AriaLiveAnnouncer>
      <EditViewColumnsPanel
        open
        onClose={jest.fn()}
        onSave={onSave}
        sortMode={EditViewColumnsPanelSortMode.CustomSelectedOnTop}
        columns={columns()}
        {...props}
      />
    </AriaLiveAnnouncer>
  )
  return onSave
}

/**
 * What the announcer's live region holds now. It writes each message as `innerText` on a span of
 * its own, which jsdom keeps as a property rather than as text, and clears the region through
 * `innerText` too, which jsdom ignores: the newest message is the last span.
 */
const announced = () =>
  Array.from(document.body.querySelectorAll('[aria-live]'))
    .map((region) => {
      const spans = region.querySelectorAll('span')
      const span = spans[spans.length - 1] as HTMLElement | undefined
      return (span && (span.innerText || span.textContent)) || region.textContent || ''
    })
    .join(' ')

/** The column names in the order the panel lists them. */
const listedNames = () =>
  screen.getAllByText(/^(Tittel|Fase|Budsjett)$/).map((label) => label.textContent)
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('EditViewColumnsPanel', () => {
  it('lists the selected columns first, then the rest; a locked column cannot be unchosen', () => {
    renderPanel()
    expect(listedNames()).toEqual(['Tittel', 'Fase', 'Budsjett'])
    expect(screen.getByRole('checkbox', { name: 'Tittel' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Tittel' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Budsjett' })).not.toBeChecked()
  })

  it("follows the view's own column order for the selected columns", () => {
    renderPanel({ customColumnOrder: [2, 1] })
    expect(listedNames()).toEqual(['Fase', 'Tittel', 'Budsjett'])
  })

  it('hands back the selected columns and their ids on use', async () => {
    const user = setupUser()
    const onSave = renderPanel()
    await user.click(screen.getByRole('button', { name: strings.UseChangesButtonText }))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0].map((c: any) => c.name)).toEqual(['Tittel', 'Fase'])
    expect(onSave.mock.calls[0][1]).toEqual([1, 2])
  })

  it('adds a chosen column to the set and removes an unchosen one', async () => {
    const user = setupUser()
    const onSave = renderPanel()
    await user.click(screen.getByRole('checkbox', { name: 'Budsjett' }))
    await user.click(screen.getByRole('checkbox', { name: 'Fase' }))
    await user.click(screen.getByRole('button', { name: strings.UseChangesButtonText }))
    expect(onSave.mock.calls[0][1]).toEqual([1, 3])
  })

  it('moves a selected column down and up again', async () => {
    const user = setupUser()
    const onSave = renderPanel()
    const move = (direction: string) =>
      screen.getByRole('button', { name: format(direction, 'Tittel') })
    await user.click(move(strings.MoveColumnDown))
    expect(listedNames()).toEqual(['Fase', 'Tittel', 'Budsjett'])
    await user.click(move(strings.MoveColumnUp))
    expect(listedNames()).toEqual(['Tittel', 'Fase', 'Budsjett'])
    await user.click(move(strings.MoveColumnDown))
    await user.click(screen.getByRole('button', { name: strings.UseChangesButtonText }))
    expect(onSave.mock.calls[0][1]).toEqual([2, 1])
  })

  it('names each move by its column, keeps one that cannot be made focusable with its reason, and tells where a column went (WCAG 2.1.1, 2.4.6, 4.1.3)', async () => {
    const user = setupUser()
    renderPanel()
    const up = screen.getByRole('button', { name: format(strings.MoveColumnUp, 'Tittel') })
    expect(up).toHaveAttribute('aria-disabled', 'true')
    expect(up).toHaveAttribute('title', strings.Aria.MoveUpDisabled)
    await user.click(screen.getByRole('button', { name: format(strings.MoveColumnDown, 'Tittel') }))
    await waitFor(() =>
      expect(announced()).toContain(format(strings.ColumnMovedAnnouncement, 'Tittel', 2, 2))
    )
  })

  it('tells in Norwegian how to drag a column with the keyboard, and where it is as it goes (WCAG 3.1.2, 4.1.3)', () => {
    renderPanel()
    // The drag-and-drop library's own instructions and announcements are English.
    expect(screen.getByText(strings.DragHandleInstructions)).toBeInTheDocument()
    let panel: ReturnType<typeof useEditViewColumnsPanel>
    const props = {
      ...EDIT_VIEW_COLUMNS_PANEL_DEFAULT_PROPS,
      open: true,
      onClose: jest.fn(),
      onSave: jest.fn(),
      sortMode: EditViewColumnsPanelSortMode.CustomSelectedOnTop,
      columns: columns()
    } as any
    const Probe: React.FC = () => {
      panel = useEditViewColumnsPanel(props)
      return null
    }
    render(<Probe />)
    const announce = jest.fn()
    act(() =>
      panel.onDragStart({ source: { index: 0 }, draggableId: 'Tittel' } as any, { announce })
    )
    expect(announce).toHaveBeenLastCalledWith(format(strings.ColumnLiftedAnnouncement, 'Tittel', 1))
    act(() =>
      panel.onDragUpdate(
        { source: { index: 0 }, destination: { index: 1 }, draggableId: 'Tittel' } as any,
        { announce }
      )
    )
    expect(announce).toHaveBeenLastCalledWith(format(strings.ColumnDragPositionAnnouncement, 2, 2))
    act(() =>
      panel.onDragEnd({ source: { index: 0 }, destination: null, draggableId: 'Tittel' } as any, {
        announce
      })
    )
    expect(announce).toHaveBeenLastCalledWith(
      format(strings.ColumnDropCancelledAnnouncement, 'Tittel', 1)
    )
    act(() =>
      panel.onDragEnd(
        { source: { index: 0 }, destination: { index: 1 }, draggableId: 'Tittel' } as any,
        { announce }
      )
    )
    expect(announce).toHaveBeenLastCalledWith(
      format(strings.ColumnMovedAnnouncement, 'Tittel', 2, 2)
    )
  })

  it('drops a dragged column where it lands, and ignores a drop outside the list', () => {
    // A drag cannot be performed under jsdom (every element measures zero), so the drop the
    // drag-and-drop library reports is handed to the panel's handler directly.
    let panel: ReturnType<typeof useEditViewColumnsPanel>
    // The props are made once: new columns on every render would make the panel select them again.
    const props = {
      ...EDIT_VIEW_COLUMNS_PANEL_DEFAULT_PROPS,
      open: true,
      onClose: jest.fn(),
      onSave: jest.fn(),
      sortMode: EditViewColumnsPanelSortMode.CustomSelectedOnTop,
      columns: columns()
    } as any
    const Probe: React.FC = () => {
      panel = useEditViewColumnsPanel(props)
      return null
    }
    render(<Probe />)
    const selectedNames = () => panel.selectedColumns.map((c) => c.name)
    expect(selectedNames()).toEqual(['Tittel', 'Fase'])
    act(() => panel.onDragEnd({ source: { index: 0 }, destination: { index: 1 } } as any, null))
    expect(selectedNames()).toEqual(['Fase', 'Tittel'])
    act(() => panel.onDragEnd({ source: { index: 0 }, destination: null } as any, null))
    expect(selectedNames()).toEqual(['Fase', 'Tittel'])
  })

  it('offers the revert button when the view has a custom order', async () => {
    const user = setupUser()
    const onClick = jest.fn()
    renderPanel({ customColumnOrder: [2, 1], revertOrder: { onClick, disabled: false } })
    await user.click(screen.getByRole('button', { name: strings.RevertCustomOrderButtonText }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0]).toHaveLength(3)
  })
})
