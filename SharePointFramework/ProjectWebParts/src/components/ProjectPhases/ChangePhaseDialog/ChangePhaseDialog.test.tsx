// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The checklist update, the phase change and the hooks reach
// SharePoint; all are stand-ins.
const mockUpdateChecklistItem = jest.fn()
const mockChangePhase = jest.fn()
jest.mock('../../../data', () => ({
  __esModule: true,
  default: {
    project: { updateChecklistItem: (...args: any[]) => mockUpdateChecklistItem(...args) }
  }
}))
jest.mock('../useChangePhase', () => ({ useChangePhase: () => mockChangePhase }))
jest.mock('../usePhaseHooks', () => ({ usePhaseHooks: () => [jest.fn(), jest.fn()] }))
// The archive step lists the site's documents and lists, which it reads from SharePoint; the test
// hands it its sections.
const archive: { sections: any[] } = { sections: [] }
jest.mock('./Views/ArchiveView/useArchiveView', () => ({
  useArchiveView: () => ({
    sections: archive.sections,
    isLoading: false,
    toggleSection: jest.fn(),
    toggleItemSelection: jest.fn(),
    toggleSectionSelectAll: jest.fn(),
    getSelectedItemsCount: () => 0,
    getSectionContentId: (key: string) => `archive-section-${key}`
  })
}))

import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import resource from 'SharedResources'
import * as React from 'react'
import { ProjectPhasesContext } from '../context'
import { checklistItem, phase } from '../testFixtures'
import { ChangePhaseDialog } from './ChangePhaseDialog'
import { announced } from 'pp365-jest-config/lib/announce'

/**
 * The change-phase dialog: the open checkpoints one by one with a comment and a status, the
 * summary of them, the confirmation, and the buttons that move between the steps or cancel. It is
 * rendered under an `AriaLiveAnnouncer`, as every root of ours is (`renderReact`), so what it
 * announces can be read from the announcer's live region.
 */
function renderDialog(current: any, next: any, props: Record<string, any> = {}) {
  const dispatch = jest.fn()
  render(
    <AriaLiveAnnouncer>
      <ProjectPhasesContext.Provider
        value={
          {
            state: {
              phase: current,
              confirmPhase: next,
              data: { phases: [current, next].filter(Boolean), phaseSitePages: [] }
            },
            props: {
              useArchive: false,
              useDynamicHomepage: false,
              commentMinLength: 4,
              webAbsoluteUrl: '/sites/alfa',
              ...props
            },
            dispatch
          } as any
        }
      >
        <ChangePhaseDialog />
      </ProjectPhasesContext.Provider>
    </AriaLiveAnnouncer>
  )
  return dispatch
}

const planning = phase('p2', 'Planlegge')

/**
 * A button that cannot be used yet, but stays focusable so the keyboard and a screen reader reach
 * the reason in its title (`disabledFocusable`).
 */
function expectUnavailable(button: HTMLElement, reason?: string) {
  expect(button).toHaveAttribute('aria-disabled', 'true')
  expect(button).not.toHaveAttribute('disabled')
  if (reason) expect(button).toHaveAttribute('title', reason)
}

describe('ChangePhaseDialog', () => {
  beforeEach(() => {
    mockUpdateChecklistItem.mockReset().mockResolvedValue(undefined)
    mockChangePhase.mockReset().mockResolvedValue(undefined)
  })

  it('walks through the open checkpoints, needing a comment to leave one open or irrelevant', async () => {
    const user = userEvent.setup()
    const current = phase('p1', 'Konsept', {}, [
      checklistItem(1, 'Mandat godkjent'),
      checklistItem(2, 'Interessenter kartlagt', strings.StatusClosed, 'Ferdig'),
      checklistItem(3, 'Budsjett avklart')
    ])
    renderDialog(current, planning)
    expect(
      screen.getByText(format(strings.ChangePhaseDialogTitle, 'Planlegge'))
    ).toBeInTheDocument()
    const steps = screen.getByRole('list', { name: strings.Aria.ChecklistStepsLabel })
    expect(
      within(steps)
        .getAllByRole('listitem')
        .map((step) => step.textContent)
    ).toEqual(['1', '2', '3'])
    expect(screen.getByText('Mandat godkjent')).toBeInTheDocument()
    expectUnavailable(screen.getByRole('button', { name: strings.StatusNotRelevant }))
    expectUnavailable(screen.getByRole('button', { name: strings.StatusStillOpen }))
    expect(screen.getByRole('button', { name: strings.StatusClosed })).toBeEnabled()
    // Skipping the checklist is allowed when it is not mandatory.
    expect(screen.getByRole('button', { name: strings.Skip })).toBeEnabled()

    await user.type(screen.getByRole('textbox'), 'Ikke relevant her')
    expect(screen.getByRole('button', { name: strings.StatusNotRelevant })).not.toHaveAttribute(
      'aria-disabled'
    )
    await user.click(screen.getByRole('button', { name: strings.StatusNotRelevant }))
    await waitFor(() =>
      expect(mockUpdateChecklistItem).toHaveBeenCalledWith(resource.Lists_PhaseChecklist_Title, 1, {
        GtChecklistStatus: strings.StatusNotRelevant,
        GtComment: 'Ikke relevant her'
      })
    )
    // On to the next open checkpoint; the closed one in between is skipped.
    expect(await screen.findByText('Budsjett avklart')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: strings.StatusClosed }))
    // The last one done: the summary lists every checkpoint.
    expect(await screen.findByText('1. Mandat godkjent')).toBeInTheDocument()
    expect(screen.getByText('2. Interessenter kartlagt')).toBeInTheDocument()
    expect(screen.getByText('3. Budsjett avklart')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.MoveOn })).toBeInTheDocument()
  })

  it('locks the skip button when the checklist is mandatory', () => {
    const current = phase('p1', 'Konsept', { ChecklistMandatory: 'true' }, [
      checklistItem(1, 'Mandat godkjent')
    ])
    renderDialog(current, planning)
    expectUnavailable(
      screen.getByRole('button', { name: strings.Skip }),
      strings.ChecklistMandatory
    )
  })

  it('confirms the change without a checklist, and cancels', async () => {
    const user = userEvent.setup()
    const dispatch = renderDialog(phase('p1', 'Konsept'), planning)
    expect(screen.getByText(format(strings.ConfirmChangePhase, 'Planlegge'))).toBeInTheDocument()
    expect(
      screen.getByText(format(strings.ChangePhaseDialogSubtitle, 'Konsept', 'Planlegge'))
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: strings.CancelText }))
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DISMISS_CHANGE_PHASE_DIALOG' })
    )
  })

  it('changes the phase on yes and closes', async () => {
    const user = userEvent.setup()
    const dispatch = renderDialog(phase('p1', 'Konsept'), planning)
    await user.click(screen.getByRole('button', { name: strings.Yes }))
    await waitFor(() => expect(mockChangePhase).toHaveBeenCalledTimes(1))
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DISMISS_CHANGE_PHASE_DIALOG' })
    )
  })

  it('tells the first phase from a change between phases', () => {
    renderDialog(undefined, planning)
    expect(
      screen.getByText(format(strings.ChangeFirstPhaseDialogSubtitle, 'Planlegge'))
    ).toBeInTheDocument()
  })

  it('labels the comment, and shows the checkpoints as steps with the current one marked (WCAG 1.3.1, 3.3.2)', async () => {
    const current = phase('p1', 'Konsept', {}, [
      checklistItem(1, 'Mandat godkjent'),
      checklistItem(2, 'Budsjett avklart')
    ])
    renderDialog(current, planning)
    expect(screen.getByRole('textbox', { name: strings.CommentLabel })).toBeInTheDocument()
    // Steps, not tabs: choosing one did nothing, and no panel belonged to it.
    expect(screen.queryByRole('tab')).toBeNull()
    const steps = within(
      screen.getByRole('list', { name: strings.Aria.ChecklistStepsLabel })
    ).getAllByRole('listitem')
    expect(steps[0]).toHaveAttribute('aria-current', 'step')
    expect(steps[1]).not.toHaveAttribute('aria-current')
    expect(await axeComponent(screen.getByRole('dialog'))).toHaveNoViolations()
  })

  it('lets the keyboard reach why a status needs a comment first (WCAG 2.1.1)', async () => {
    const user = userEvent.setup()
    renderDialog(phase('p1', 'Konsept', {}, [checklistItem(1, 'Mandat godkjent')]), planning)
    const notRelevant = screen.getByRole('button', { name: strings.StatusNotRelevant })
    expectUnavailable(notRelevant, strings.CheckpointNotRelevantTooltipCommentEmpty)
    await user.click(notRelevant)
    expect(mockUpdateChecklistItem).not.toHaveBeenCalled()
  })

  it('closes on Escape, but not while the phase is changing', async () => {
    const dispatch = renderDialog(phase('p1', 'Konsept'), planning)
    fireEvent.keyDown(screen.getByRole('button', { name: strings.Yes }), { key: 'Escape' })
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DISMISS_CHANGE_PHASE_DIALOG' })
    )
  })

  it('stays open on a click outside it, which never closed it before', () => {
    const dispatch = renderDialog(phase('p1', 'Konsept'), planning)
    // Fluent reports a click on the backdrop as a request to close, as it does Escape; with the
    // handler that answers Escape, a stray click threw away the checklist.
    const backdrop = document.querySelector('.fui-DialogSurface__backdrop')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop)
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DISMISS_CHANGE_PHASE_DIALOG' })
    )
  })

  it('tells a screen reader that the phase is changing, and cannot be closed meanwhile (WCAG 4.1.3)', async () => {
    const user = userEvent.setup()
    mockChangePhase.mockImplementation(() => new Promise(() => undefined))
    const dispatch = renderDialog(phase('p1', 'Konsept'), planning)
    await user.click(screen.getByRole('button', { name: strings.Yes }))
    await waitFor(() =>
      expect(announced()).toContain(format(strings.ChangingPhaseDescription, 'Planlegge'))
    )
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DISMISS_CHANGE_PHASE_DIALOG' })
    )
  })

  it("names each checkpoint's status in the summary, and says whether its comment shows (WCAG 1.1.1, 4.1.2)", async () => {
    const user = userEvent.setup()
    const current = phase('p1', 'Konsept', {}, [
      checklistItem(1, 'Mandat godkjent', strings.StatusClosed, 'Signert'),
      checklistItem(2, 'Budsjett avklart', strings.StatusNotRelevant, 'Dekkes av programmet')
    ])
    renderDialog(current, planning)
    expect(await screen.findByText('1. Mandat godkjent')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: strings.StatusClosed })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: strings.StatusNotRelevant })).toBeInTheDocument()
    const [show] = screen.getAllByRole('button', { name: strings.ShowCommentText })
    expect(show).toHaveAttribute('aria-expanded', 'false')
    await user.click(show)
    expect(screen.getByRole('button', { name: strings.HideCommentText })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByText('Signert')).toBeVisible()
    expect(await axeComponent(screen.getByRole('dialog'))).toHaveNoViolations()
  })

  it('says whether each archive section is open (WCAG 4.1.2)', () => {
    archive.sections = [
      {
        key: 'documents',
        title: 'Dokumenter',
        expanded: false,
        items: [{ id: 1, title: 'Plan.docx', type: 'file', selected: false }]
      },
      {
        key: 'lists',
        title: 'Lister',
        expanded: true,
        items: [{ id: 2, title: 'Risikoer', type: 'list', selected: true, itemCount: 3 }]
      }
    ]
    renderDialog(phase('p1', 'Konsept'), planning, { useArchive: true })
    expect(screen.getByRole('button', { name: /^Dokumenter/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    const lists = screen.getByRole('button', { name: /^Lister/ })
    expect(lists).toHaveAttribute('aria-expanded', 'true')
    // It names the items it folds.
    expect(document.getElementById(lists.getAttribute('aria-controls'))).toHaveTextContent(
      'Risikoer'
    )
  })
})
