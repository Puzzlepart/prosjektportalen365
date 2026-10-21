import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import strings from 'ProjectExtensionsStrings'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { ProgressDialog } from '.'
import { ITaskProgress } from './types'

/**
 * What the announcer's live region holds now. It writes each message as `innerText` on a span of
 * its own, which jsdom keeps as a property rather than as text, and clears the region through
 * `innerText` too, which jsdom ignores: the newest message is the last span.
 */
const announced = () =>
  Array.from(document.body.querySelectorAll('[aria-live]'))
    .map((region) => {
      const spans = region.querySelectorAll('span')
      const span = spans[spans.length - 1] as HTMLElement | undefined
      return (span && (span.innerText || span.textContent)) || region.textContent || ''
    })
    .join(' ')

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

  it('tells each step as it starts (WCAG 4.1.3)', async () => {
    const dialog = (label: string, currentStep: number) => (
      <AriaLiveAnnouncer>
        <ProgressDialog
          progressIndicator={{ label, description: '' }}
          taskProgress={tasks()}
          currentStep={currentStep}
          totalSteps={3}
        />
      </AriaLiveAnnouncer>
    )
    const { rerender } = render(dialog('SitePermissions', 1))
    rerender(dialog('ApplyTemplate', 2))
    await waitFor(() =>
      expect(announced()).toContain(format(strings.ProgressStepAnnouncement, 3, 3, 'ApplyTemplate'))
    )
  })

  it('says whether the advanced log is shown, and names each step by its status and its log (WCAG 1.1.1, 1.4.1, 4.1.2)', () => {
    render(
      <ProgressDialog
        progressIndicator={INDICATOR}
        taskProgress={tasks()}
        currentStep={1}
        totalSteps={3}
      />
    )
    const toggle = screen.getByRole('button', { name: strings.ProgressAdvancedLogLabel })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(toggle.getAttribute('aria-controls'))).toBeInTheDocument()
    const step = (task: string, status: string, entries?: number) =>
      screen.getByRole('button', {
        name: entries
          ? format(strings.ProgressTaskLabelWithEntries, task, status, entries)
          : format(strings.ProgressTaskLabel, task, status)
      })
    expect(step('PreTask', strings.ProgressTaskStatusCompleted, 1)).toBeInTheDocument()
    expect(step('SitePermissions', strings.ProgressTaskStatusRunning, 2)).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(step('ApplyTemplate', strings.ProgressTaskStatusPending)).toBeInTheDocument()
  })

  it('names the level of each log entry, lets the keyboard scroll the log, and breaks no rule axe can check (WCAG 1.1.1, 2.1.1)', async () => {
    render(
      <ProgressDialog
        progressIndicator={INDICATOR}
        taskProgress={tasks()}
        currentStep={1}
        totalSteps={3}
        version='v1.15.0'
      />
    )
    fireEvent.click(screen.getByText(strings.ProgressAdvancedLogLabel))
    const log = screen.getByRole('log', { name: 'SitePermissions' })
    expect(log).toHaveAttribute('tabindex', '0')
    expect(
      within(log).getByRole('img', { name: strings.ProgressLogLevelWarning })
    ).toBeInTheDocument()
    expect(within(log).getByRole('img', { name: strings.ProgressLogLevelInfo })).toBeInTheDocument()
    expect(await axeComponent(screen.getByRole('alertdialog'))).toHaveNoViolations()
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

  it('waits for the user and shows the warning when setup completes with one', () => {
    const onDismiss = jest.fn()
    const warning = { title: 'Ikke registrert i porteføljen', text: 'Kontakt en administrator.' }
    const { rerender } = render(
      <ProgressDialog progressIndicator={INDICATOR} taskProgress={tasks()} onDismiss={onDismiss} />
    )
    rerender(
      <ProgressDialog
        progressIndicator={INDICATOR}
        taskProgress={tasks()}
        onDismiss={onDismiss}
        warning={warning}
        isComplete
      />
    )
    expect(onDismiss).not.toHaveBeenCalled()
    expect(screen.getByText(warning.title)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: strings.ContinueToProjectText }))
    expect(onDismiss).toHaveBeenCalled()
  })
})
