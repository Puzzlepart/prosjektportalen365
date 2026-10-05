import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { EditViewColumnsPanel } from './EditViewColumnsPanel'
import { EditViewColumnsPanelSortMode } from './types'

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
    <EditViewColumnsPanel
      open
      onClose={jest.fn()}
      onSave={onSave}
      sortMode={EditViewColumnsPanelSortMode.CustomSelectedOnTop}
      columns={columns()}
      {...props}
    />
  )
  return onSave
}

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
    await user.click(screen.getByTitle(strings.Aria.MoveDown))
    expect(listedNames()).toEqual(['Fase', 'Tittel', 'Budsjett'])
    await user.click(screen.getByTitle(strings.Aria.MoveUp))
    expect(listedNames()).toEqual(['Tittel', 'Fase', 'Budsjett'])
    await user.click(screen.getByTitle(strings.Aria.MoveDown))
    await user.click(screen.getByRole('button', { name: strings.UseChangesButtonText }))
    expect(onSave.mock.calls[0][1]).toEqual([2, 1])
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
