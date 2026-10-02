import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import strings from 'ProjectExtensionsStrings'
import * as React from 'react'
import { ProjectSetupError } from '../../extensions/projectSetup/ProjectSetupError'
import { ErrorDialog } from '.'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('ErrorDialog', () => {
  it('shows what went wrong and what to do, and closes', () => {
    const onDismiss = jest.fn()
    render(
      <ErrorDialog
        error={
          new ProjectSetupError(
            'NoHubConnection',
            strings.NoHubSiteErrorMessage,
            strings.NoHubSiteErrorStack,
            'warning'
          )
        }
        showStackAsSubText
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByText(strings.NoHubSiteErrorMessage)).toBeInTheDocument()
    expect(screen.getByText(strings.NoHubSiteErrorStack, { selector: 'p' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: strings.CloseModalText }))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('shows the explanation as a message when it is not the subtitle', () => {
    const error = new Error('Uventet feil')
    error.stack = 'Hubområdet svarte ikke'
    render(<ErrorDialog error={error} onDismiss={jest.fn()} />)
    expect(screen.getByText('Uventet feil')).toBeInTheDocument()
    expect(screen.getByText('Hubområdet svarte ikke')).toBeVisible()
    expect(screen.queryByText('Hubområdet svarte ikke', { selector: 'p' })).toBeNull()
  })

  it('offers the setup again, or the project, when the project is set up already', () => {
    const onDismiss = jest.fn()
    const onSetupClick = jest.fn()
    render(
      <ErrorDialog
        error={
          new ProjectSetupError(
            'AlreadySetup',
            strings.ProjectAlreadySetupMessage,
            strings.ProjectAlreadySetupStack
          )
        }
        onDismiss={onDismiss}
        onSetupClick={onSetupClick}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: strings.ProvisionTemplateText }))
    expect(onSetupClick).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: strings.ContinueToProjectText }))
    expect(onDismiss).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: strings.CloseModalText })).toBeNull()
  })
})
