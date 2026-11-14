import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import * as React from 'react'
import { ConfirmDialogResponseValue, IConfirmDialogProps, useConfirmationDialog } from '.'

const DELETE: IConfirmDialogProps = {
  title: 'Slette visningen?',
  subText: 'Visningen kan ikke gjenopprettes.',
  responses: [
    ['Slett', true, true],
    ['Avbryt', false]
  ]
}

/** Renders the dialog and opens it with `props`; `answer` resolves with the response. */
function openDialog(props: IConfirmDialogProps) {
  let answer: Promise<ConfirmDialogResponseValue>
  const Host: React.FC = () => {
    const [dialog, getResponse] = useConfirmationDialog()
    return (
      <>
        <button onClick={() => (answer = getResponse(props))}>Åpne</button>
        {dialog}
      </>
    )
  }
  render(<Host />)
  fireEvent.click(screen.getByText('Åpne'))
  return () => answer
}

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('useConfirmationDialog', () => {
  it('asks with its title, text and extra content, and answers with the response picked', async () => {
    const answer = openDialog({ ...DELETE, children: <p>Den brukes av tre personer.</p> })
    expect(screen.getByText('Slette visningen?')).toBeInTheDocument()
    expect(screen.getByText('Visningen kan ikke gjenopprettes.')).toBeInTheDocument()
    expect(screen.getByText('Den brukes av tre personer.')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Slett'))
    await expect(answer()).resolves.toBe(true)
    await waitFor(() => expect(screen.queryByText('Slette visningen?')).toBeNull())
  })

  it('answers with the value of any response', async () => {
    const answer = openDialog(DELETE)
    fireEvent.click(screen.getByText('Avbryt'))
    await expect(answer()).resolves.toBe(false)
  })

  it('opens with the focus on the dialog, read from its title and question, not on an answer (Puzzlepart/prosjektportalen365-testing#132)', async () => {
    // On the first answer a screen reader read «Slett, button» first, and the question only by
    // reading backwards (VoiceOver); Enter as the dialog opened deleted the column (WCAG 3.3.4).
    const answer = openDialog(DELETE)
    const dialog = screen.getByRole('dialog')
    await waitFor(() => expect(dialog).toHaveFocus())
    expect(dialog).toHaveAccessibleName('Slette visningen?')
    expect(dialog).toHaveAccessibleDescription('Visningen kan ikke gjenopprettes.')
    // Out of the tab order, with the answers after it, where Tab goes next.
    expect(dialog).toHaveAttribute('tabindex', '-1')
    const [first] = within(dialog).getAllByRole('button')
    expect(first).toHaveTextContent('Slett')
    expect(dialog.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.keyDown(dialog, { key: 'Enter' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(dialog, { key: 'Escape' })
    await expect(answer()).resolves.toBeUndefined()
  })

  it('takes Escape as no answer, not as the first response', async () => {
    const answer = openDialog(DELETE)
    fireEvent.keyDown(screen.getByText('Slette visningen?'), { key: 'Escape' })
    await expect(answer()).resolves.toBeUndefined()
  })

  it('is a dialog named by its title and described by its text, so both are read as it opens', async () => {
    openDialog({ ...DELETE, children: <p>Den brukes av tre personer.</p> })
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAccessibleName('Slette visningen?')
    expect(dialog).toHaveAccessibleDescription(
      /^Visningen kan ikke gjenopprettes\.\s*Den brukes av tre personer\.$/
    )
    expect(await axeComponent(document.body)).toHaveNoViolations()
  })
})
