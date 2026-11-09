import { useRestoreFocusTarget } from '@fluentui/react-components'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
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

  it('gives the focus back to delete as its confirmation closes, not to the column header behind the panel (WCAG 2.4.3)', () => {
    let target: ReturnType<typeof useRestoreFocusTarget>
    const Probe: React.FC = () => {
      target = useRestoreFocusTarget()
      return null
    }
    render(<Probe />)
    renderFooter({ isEditing: true })
    const [attribute, value] = Object.entries(target)[0]
    expect(screen.getByRole('button', { name: 'Slett' })).toHaveAttribute(attribute, value)
  })

  it('calls onSave when save is clicked', async () => {
    const { onSave, user } = renderFooter()
    await user.click(screen.getByRole('button', { name: 'Lagre' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('keeps save from saving while the form is incomplete, and lets the keyboard reach why (WCAG 2.1.1, 3.3.2)', async () => {
    // A disabled button is skipped by the keyboard, and what it needed was nowhere.
    const { onSave, user } = renderFooter({ isSaveDisabled: true })
    const save = screen.getByRole('button', { name: 'Lagre' })
    expect(save).toHaveAttribute('aria-disabled', 'true')
    expect(save).toHaveAccessibleDescription(strings.ColumnFormSaveDisabledReason)
    await user.click(save)
    expect(onSave).not.toHaveBeenCalled()
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
