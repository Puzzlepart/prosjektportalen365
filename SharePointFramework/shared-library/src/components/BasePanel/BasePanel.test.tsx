import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { BasePanel } from './BasePanel'

/**
 * The panel's contract, asserted through roles and text so it survives the move
 * from the Fluent UI v8 `Panel` to the v9 `OverlayDrawer`. Nothing here depends
 * on which of the two rendered it.
 *
 * Presence rather than visibility: the v8 `Panel` renders through a `Layer`
 * portal that jsdom cannot resolve a computed visibility for, so `toBeVisible`
 * fails there even though the content is in the document. What matters for the
 * conversion is that the content is rendered when open and gone when closed.
 */
describe('BasePanel', () => {
  it('renders nothing while closed', () => {
    render(
      <BasePanel open={false} headerText='Alle egenskaper'>
        <div>Innhold</div>
      </BasePanel>
    )
    expect(screen.queryByText('Alle egenskaper')).toBeNull()
    expect(screen.queryByText('Innhold')).toBeNull()
  })

  it('shows its header and children when open', () => {
    render(
      <BasePanel open headerText='Alle egenskaper'>
        <div>Innhold</div>
      </BasePanel>
    )
    expect(screen.getByText('Alle egenskaper')).toBeInTheDocument()
    expect(screen.getByText('Innhold')).toBeInTheDocument()
  })

  it('renders its children', () => {
    render(
      <BasePanel open headerText='Tittel'>
        <div>Kropp</div>
      </BasePanel>
    )
    expect(screen.getByText('Kropp')).toBeInTheDocument()
  })

  it('renders its footer', () => {
    render(
      <BasePanel
        open
        headerText='Tittel'
        footer={<button>Lagre</button>}
      />
    )
    expect(screen.getByRole('button', { name: 'Lagre' })).toBeInTheDocument()
  })

  it('dismisses when the close button is used', async () => {
    const onClose = jest.fn()
    const user = userEvent.setup()
    render(
      <BasePanel open headerText='Tittel' onClose={onClose}>
        <div>Innhold</div>
      </BasePanel>
    )
    // The close affordance is the only button in the panel chrome; it carries an
    // aria-label rather than text, so it is found by role and accessible name.
    const close = screen
      .getAllByRole('button')
      .find((b) => /lukk|close/i.test(b.getAttribute('aria-label') ?? ''))
    expect(close).toBeTruthy()
    await user.click(close)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
