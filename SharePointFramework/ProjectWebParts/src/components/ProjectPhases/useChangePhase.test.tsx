// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter changes the phase (`adapter.updateProjectPhase`
// resolves to the hub's error, or null); the hooks the change runs after it are stand-ins.
const adapter = { updateProjectPhase: jest.fn() }
jest.mock('../../data', () => ({ __esModule: true, default: adapter }))
jest.mock('.', () => ({ ProjectPhases: { displayName: 'Project Phases' } }))
jest.mock('pp365-shared-library/lib/logging', () => ({
  ListLogger: { log: jest.fn(() => Promise.resolve()) }
}))
jest.mock('./usePhaseHooks', () => ({ usePhaseHooks: () => [jest.fn()] }))
jest.mock('./useChangeWelcomePage', () => ({
  useChangeWelcomePage: () => jest.fn(() => Promise.resolve())
}))
jest.mock('./useModifyCurrentPhaseView', () => ({
  useModifyCurrentPhaseView: () => jest.fn(() => Promise.resolve())
}))

import { act, render } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import resource from 'SharedResources'
import * as React from 'react'
import { ProjectPhasesContext } from './context'
import { ARCHIVE_LOG_FAILED, CHANGE_PHASE_ERROR, HUB_SYNC_FAILED, SET_PHASE } from './reducer'
import { useChangePhase } from './useChangePhase'

/**
 * Changing the phase: the phase is changed on the project whether or not the hub takes it, and a
 * change the hub did not take is reported with the reason, without the reload that would take the
 * warning away.
 */
const PLANNING = { name: 'Planlegge' }
const PHASE_FIELD = { fieldName: 'GtProjectPhase', textField: 'GtProjectPhaseTaxHTField' }

/**
 * Runs the change as the dialog's "yes" does, with the error from writing the archive log when
 * one is given, and returns what it dispatched.
 *
 * @param archiveLogError The error from writing the archive log (optional)
 */
async function changePhase(archiveLogError?: Error) {
  const dispatch = jest.fn()
  let change: (archiveLogError?: Error) => Promise<void>
  /** Exposes the mounted phase-change callback for exercising its async workflow. */
  const Probe: React.FC = () => {
    change = useChangePhase()
    return null
  }
  render(
    <ProjectPhasesContext.Provider
      value={{
        state: { confirmPhase: PLANNING, data: { phaseField: PHASE_FIELD } } as any,
        props: { syncPropertiesAfterPhaseChange: true, webAbsoluteUrl: '/sites/frisbee' } as any,
        dispatch
      }}
    >
      <Probe />
    </ProjectPhasesContext.Provider>
  )
  await act(() => change(archiveLogError))
  return dispatch.mock.calls.map(([action]) => action)
}

beforeEach(() => {
  jest.useFakeTimers()
  adapter.updateProjectPhase.mockReset()
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

describe('useChangePhase', () => {
  it('changes the phase, on the project and in the hub, and reloads the page', async () => {
    adapter.updateProjectPhase.mockResolvedValue(null)
    const actions = await changePhase()
    expect(adapter.updateProjectPhase).toHaveBeenCalledWith(PLANNING, PHASE_FIELD)
    expect(actions).toContainEqual(SET_PHASE({ phase: PLANNING as any }))
    expect(actions.some(({ type }) => type === HUB_SYNC_FAILED.type)).toBe(false)
    expect(jest.getTimerCount()).toBe(1)
  })

  it('keeps the new phase and warns, without a reload, when the hub does not take it', async () => {
    adapter.updateProjectPhase.mockResolvedValue(
      Object.assign(new Error('Access is denied.'), { status: 403 })
    )
    const actions = await changePhase()
    expect(actions).toContainEqual(SET_PHASE({ phase: PLANNING as any }))
    expect(actions).toContainEqual(
      HUB_SYNC_FAILED({
        warning: format(
          strings.PhaseNotSyncedToHubText,
          format(strings.HubSyncNoWriteAccessReason, resource.Lists_Projects_Title)
        )
      })
    )
    expect(jest.getTimerCount()).toBe(0)
  })

  it('keeps the new phase and warns, without a reload, when the archive log was not written', async () => {
    // A member of an upgraded hub reads `Arkiveringslogg` but may not write to it.
    adapter.updateProjectPhase.mockResolvedValue(null)
    const actions = await changePhase(
      Object.assign(new Error('Access is denied.'), { status: 403 })
    )
    expect(actions).toContainEqual(SET_PHASE({ phase: PLANNING as any }))
    expect(actions).toContainEqual(
      ARCHIVE_LOG_FAILED({
        warning: format(
          strings.ArchiveLogNotWrittenText,
          format(strings.ArchiveLogNoWriteAccessReason, resource.Lists_ArchiveLog_Title)
        )
      })
    )
    // The warning tells the user to reload, since the page is not reloaded for them.
    expect(strings.ArchiveLogNotWrittenText).toContain(
      strings.PhaseNotSyncedToHubText.slice(strings.PhaseNotSyncedToHubText.indexOf('{0}') + 4)
    )
    expect(jest.getTimerCount()).toBe(0)
  })

  it('fails the change when the phase cannot be changed on the project', async () => {
    adapter.updateProjectPhase.mockRejectedValue(new Error('Listen finnes ikke'))
    const actions = await changePhase()
    expect(actions.some(({ type }) => type === SET_PHASE.type)).toBe(false)
    expect(actions).toContainEqual(
      CHANGE_PHASE_ERROR({ error: new Error(strings.ProjectPhasesChangePhaseError) })
    )
  })
})
