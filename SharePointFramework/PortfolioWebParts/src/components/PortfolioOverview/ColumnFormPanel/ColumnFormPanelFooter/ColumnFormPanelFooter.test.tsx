import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { PortfolioOverviewContext } from '../../context'
import { ColumnFormPanelFooter } from './index'

/**
 * The footer's contract, asserted through roles and Norwegian texts so it
 * survives the confirm dialog moving from `pzl-react-reusable-components` to
 * the shared Fluent UI v9 one. Nothing here touches Fluent internals.
 */
function renderFooter(props: Partial<React.ComponentProps<typeof ColumnFormPanelFooter>> = {}) {
  const onSave = jest.fn().mockResolvedValue(undefined)
  const onDeleteColumn = jest.fn().mockResolvedValue(undefined)
  const dispatch = jest.fn()
  const user = userEvent.setup()
  render(
    <PortfolioOverviewContext.Provider value={{ dispatch } as any}>
      <ColumnFormPanelFooter
        onSave={onSave}
        onDeleteColumn={onDeleteColumn}
        isEditing={false}
        isSaveDisabled={false}
        {...props}
      />
    </PortfolioOverviewContext.Provider>
  )
  return { onSave, onDeleteColumn, dispatch, user }
}

describe('ColumnFormPanelFooter', () => {
  it('shows save and cancel, and hides delete unless editing', () => {
    renderFooter()
    expect(screen.getByRole('button', { name: 'Lagre' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Avbryt' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Slett' })).toBeNull()
  })

  it('shows delete when editing', () => {
    renderFooter({ isEditing: true })
    expect(screen.getByRole('button', { name: 'Slett' })).toBeVisible()
  })

  it('calls onSave when save is clicked', async () => {
    const { onSave, user } = renderFooter()
    await user.click(screen.getByRole('button', { name: 'Lagre' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('disables save when the form says so', () => {
    renderFooter({ isSaveDisabled: true })
    expect(screen.getByRole('button', { name: 'Lagre' })).toBeDisabled()
  })

  it('closes the panel on cancel without saving', async () => {
    const { dispatch, onSave, user } = renderFooter()
    await user.click(screen.getByRole('button', { name: 'Avbryt' }))
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('asks for confirmation before deleting, and deletes when confirmed', async () => {
    const { onDeleteColumn, user } = renderFooter({ isEditing: true })
    await user.click(screen.getByRole('button', { name: 'Slett' }))
    // The confirm dialog is the gate: the column must not be deleted on the
    // first click alone.
    expect(await screen.findByText('Vil du slette?')).toBeVisible()
    expect(onDeleteColumn).not.toHaveBeenCalled()
    // Scoped to the dialog, because the footer's own delete button carries the
    // same label.
    const dialog = within(screen.getByRole('dialog'))
    await user.click(dialog.getByRole('button', { name: 'Slett' }))
    await waitFor(() => expect(onDeleteColumn).toHaveBeenCalledTimes(1))
  })

  it('does not delete when the confirmation is dismissed', async () => {
    const { onDeleteColumn, user } = renderFooter({ isEditing: true })
    await user.click(screen.getByRole('button', { name: 'Slett' }))
    expect(await screen.findByText('Vil du slette?')).toBeVisible()
    const dialog = within(screen.getByRole('dialog'))
    await user.click(dialog.getByRole('button', { name: 'Avbryt' }))
    await waitFor(() => expect(screen.queryByText('Vil du slette?')).toBeNull())
    expect(onDeleteColumn).not.toHaveBeenCalled()
  })
})
