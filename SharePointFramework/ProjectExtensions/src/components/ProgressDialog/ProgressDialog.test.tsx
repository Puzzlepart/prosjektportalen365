import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { ProgressDialog } from '.'
import { ITaskProgress } from './types'

/** 2 October 2026, 14:05:09 in the machine's time zone. */
const AT = new Date(2026, 9, 2, 14, 5, 9)

function tasks(): ITaskProgress[] {
  return [
    {
      name: 'PreTask',
      status: 'completed',
      entries: [{ timestamp: AT, message: 'Forberedte oppsettet', level: 'info' }]
    },
    {
      name: 'SitePermissions',
      status: 'running',
      entries: [
        { timestamp: AT, message: 'Gir eierne tilgang', level: 'info' },
        { timestamp: AT, message: 'Fant ingen besøkende', level: 'warning' }
      ]
    },
    { name: 'ApplyTemplate', status: 'pending', entries: [] }
  ]
}

const INDICATOR = { label: 'Tilganger', description: 'Setter opp tilgangene til området' }

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('ProgressDialog', () => {
  it('shows the step it is on and how far along it is', () => {
    render(
      <ProgressDialog
        progressIndicator={INDICATOR}
        iconName='Page'
        taskProgress={tasks()}
        currentStep={1}
        totalSteps={3}
      />
    )
    expect(screen.getByText(strings.ProgressDialogTitle)).toBeInTheDocument()
    expect(screen.getByText(INDICATOR.label)).toBeInTheDocument()
    expect(screen.getByText(INDICATOR.description)).toBeInTheDocument()
    expect(screen.getByText(format(strings.ProgressStepCountText, '2', '3'))).toBeInTheDocument()
    expect(screen.queryByText('Gir eierne tilgang')).toBeNull()
  })

  it('opens the advanced log at the running step, and every other step on demand', () => {
    render(
      <ProgressDialog
        progressIndicator={INDICATOR}
        taskProgress={tasks()}
        currentStep={1}
        totalSteps={3}
      />
    )
    fireEvent.click(screen.getByText(strings.ProgressAdvancedLogLabel))
    expect(screen.getByText('Gir eierne tilgang')).toBeInTheDocument()
    expect(screen.getByText('Fant ingen besøkende')).toBeInTheDocument()
    expect(screen.queryByText('Forberedte oppsettet')).toBeNull()
    fireEvent.click(screen.getByText('PreTask'))
    expect(screen.getByText('Forberedte oppsettet')).toBeInTheDocument()
    fireEvent.click(screen.getByText('ApplyTemplate'))
    expect(screen.getByText(strings.ProgressTaskPendingText)).toBeInTheDocument()
  })

  it('shows a failed setup with its log open, the error and a way out', () => {
    const onDismiss = jest.fn()
    const failed = tasks()
    failed[1] = {
      ...failed[1],
      status: 'error',
      entries: [{ timestamp: AT, message: 'Mangler tilgang', level: 'error' }]
    }
    render(
      <ProgressDialog
        progressIndicator={INDICATOR}
        taskProgress={failed}
        currentStep={1}
        totalSteps={3}
        error={new Error('Oppsettet feilet')}
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByText('Mangler tilgang')).toBeInTheDocument()
    // The entry's time in SharePoint's UI language (Norwegian when the page names none), not in
    // jsdom's en-US, where it would read 02:05:09 PM.
    expect(screen.getByText('14:05:09')).toBeInTheDocument()
    expect(screen.getByText('Oppsettet feilet')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: strings.CloseModalText }))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('goes on to the project at once when setup completes with the log closed', () => {
    const onDismiss = jest.fn()
    const { rerender } = render(
      <ProgressDialog progressIndicator={INDICATOR} taskProgress={tasks()} onDismiss={onDismiss} />
    )
    expect(onDismiss).not.toHaveBeenCalled()
    rerender(
      <ProgressDialog
        progressIndicator={INDICATOR}
        taskProgress={tasks()}
        onDismiss={onDismiss}
        isComplete
      />
    )
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('waits for the user when the log is open as setup completes', () => {
    const onDismiss = jest.fn()
    const { rerender } = render(
      <ProgressDialog progressIndicator={INDICATOR} taskProgress={tasks()} onDismiss={onDismiss} />
    )
    fireEvent.click(screen.getByText(strings.ProgressAdvancedLogLabel))
    rerender(
      <ProgressDialog
        progressIndicator={INDICATOR}
        taskProgress={tasks()}
        onDismiss={onDismiss}
        isComplete
      />
    )
    expect(onDismiss).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: strings.ContinueToProjectText }))
    expect(onDismiss).toHaveBeenCalled()
  })
})
