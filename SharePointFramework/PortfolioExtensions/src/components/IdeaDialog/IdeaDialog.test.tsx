import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import strings from 'PortfolioExtensionsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import ProjectDataDialog, { IdeaDialog } from '.'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('IdeaDialog', () => {
  it('lets project data be created for an approved idea', () => {
    const onSubmit = jest.fn()
    render(
      <IdeaDialog
        isApproved
        dialogMessage='Prosjektdata opprettes fra ideen. Tilbake: {0}'
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />
    )
    expect(screen.getByText(strings.IdeaProjectDataDialogTitle)).toBeInTheDocument()
    expect(screen.getByText(strings.IdeaProjectDataDialogInfoTitle)).toBeInTheDocument()
    expect(
      screen.getByText(
        format(
          'Prosjektdata opprettes fra ideen. Tilbake: {0}',
          encodeURIComponent(window.location.href)
        )
      )
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: strings.CreateLabel }))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('lets an approved idea get project data when no message is configured', () => {
    render(<IdeaDialog isApproved onClose={jest.fn()} onSubmit={jest.fn()} />)
    expect(screen.getByText(strings.IdeaProjectDataDialogInfoTitle)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.CreateLabel })).toBeEnabled()
  })

  it('explains why an idea that is not approved gets no project data', () => {
    render(<IdeaDialog dialogMessage='Ikke vist' onClose={jest.fn()} onSubmit={jest.fn()} />)
    expect(screen.getByText(strings.IdeaProjectDataDialogNotApprovedMessage)).toBeInTheDocument()
    expect(screen.queryByText('Ikke vist')).toBeNull()
    expect(screen.getByRole('button', { name: strings.CreateLabel })).toBeDisabled()
  })

  it('blocks a second set of project data for the same idea', () => {
    render(<IdeaDialog isApproved isBlocked onClose={jest.fn()} onSubmit={jest.fn()} />)
    expect(screen.getByText(strings.IdeaProjectDataDialogBlockedTitle)).toBeInTheDocument()
    expect(screen.getByText(strings.IdeaProjectDataDialogBlockedMessage)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.CreateLabel })).toBeDisabled()
  })

  it('closes on cancel', () => {
    const onClose = jest.fn()
    render(<IdeaDialog onClose={onClose} onSubmit={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: strings.CancelLabel }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('ProjectDataDialog', () => {
  it('creates through the submit the command sets after showing it', async () => {
    // The command assigns `submit` right after `show()`; the dialog renders later, after the
    // current task, so the button gets the command's submit and not the default one.
    const dialog = new ProjectDataDialog()
    dialog.isApproved = true
    void dialog.show()
    dialog.submit = jest.fn()
    fireEvent.click(await screen.findByRole('button', { name: strings.CreateLabel }))
    expect(dialog.submit).toHaveBeenCalled()
    await dialog.close()
    expect(screen.queryByText(strings.IdeaProjectDataDialogTitle)).toBeNull()
  })
})
