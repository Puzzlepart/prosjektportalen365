import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import strings from 'PortfolioExtensionsStrings'
import { announced } from 'pp365-jest-config/lib/announce'
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
    // The close unmounts a microtask later; React 18 wants that inside act.
    await act(() => dialog.close())
    expect(screen.queryByText(strings.IdeaProjectDataDialogTitle)).toBeNull()
  })

  it('says in the open dialog why the project data was not created, and reads it out', async () => {
    const dialog = new ProjectDataDialog()
    dialog.isApproved = true
    void dialog.show()
    const create = await screen.findByRole('button', { name: strings.CreateLabel })
    expect(screen.queryByText(strings.IdeaProjectDataSaveErrorMessage)).toBeNull()
    act(() => dialog.setErrorMessage(strings.IdeaProjectDataSaveErrorMessage))
    expect(screen.getByText(strings.IdeaProjectDataSaveErrorMessage)).toBeInTheDocument()
    // The message bar reads itself out through the announcer every root gets (WCAG 4.1.3).
    await waitFor(() => expect(announced()).toContain(strings.IdeaProjectDataSaveErrorMessage))
    // The dialog is still there for another try, which takes the error away as it starts.
    expect(create).toBeEnabled()
    act(() => dialog.setErrorMessage())
    expect(screen.queryByText(strings.IdeaProjectDataSaveErrorMessage)).toBeNull()
    expect(screen.getByText(strings.IdeaProjectDataDialogTitle)).toBeInTheDocument()
    await act(() => dialog.close())
  })

  it('renders nothing once it is closed, and only keeps the message', async () => {
    const dialog = new ProjectDataDialog()
    void dialog.show()
    await screen.findByText(strings.IdeaProjectDataDialogTitle)
    await act(() => dialog.close())
    const rendered = jest.spyOn(dialog, 'render')
    dialog.setErrorMessage(strings.IdeaProjectDataSaveErrorMessage)
    expect(rendered).not.toHaveBeenCalled()
    expect(dialog.errorMessage).toBe(strings.IdeaProjectDataSaveErrorMessage)
  })
})
