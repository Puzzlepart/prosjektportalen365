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

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import resource from 'SharedResources'
import * as React from 'react'
import { ProjectPhasesContext } from '../context'
import { checklistItem, phase } from '../testFixtures'
import { ChangePhaseDialog } from './ChangePhaseDialog'

/**
 * The change-phase dialog: the open checkpoints one by one with a comment and a status, the
 * summary of them, the confirmation, and the buttons that move between the steps or cancel.
 */
function renderDialog(current: any, next: any, props: Record<string, any> = {}) {
  const dispatch = jest.fn()
  render(
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
  )
  return dispatch
}

const planning = phase('p2', 'Planlegge')

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
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    for (const name of ['1', '2', '3'])
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    expect(screen.getByText('Mandat godkjent')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.StatusNotRelevant })).toBeDisabled()
    expect(screen.getByRole('button', { name: strings.StatusStillOpen })).toBeDisabled()
    expect(screen.getByRole('button', { name: strings.StatusClosed })).toBeEnabled()
    // Skipping the checklist is allowed when it is not mandatory.
    expect(screen.getByRole('button', { name: strings.Skip })).toBeEnabled()

    await user.type(screen.getByRole('textbox'), 'Ikke relevant her')
    expect(screen.getByRole('button', { name: strings.StatusNotRelevant })).toBeEnabled()
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
    expect(screen.getByRole('button', { name: strings.Skip })).toBeDisabled()
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
})
