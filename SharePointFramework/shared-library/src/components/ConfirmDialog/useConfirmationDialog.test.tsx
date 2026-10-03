import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('takes Escape as no answer, not as the first response', async () => {
    const answer = openDialog(DELETE)
    fireEvent.keyDown(screen.getByText('Slette visningen?'), { key: 'Escape' })
    await expect(answer()).resolves.toBeUndefined()
  })
})
