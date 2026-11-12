// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter changes the phase (`adapter.updateProjectPhase`
// resolves to the hub's error, or null); the hooks the change runs after it are stand-ins. Telemetry
// is the real one, counting in the window's memory, but for its flush, which the test records.
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
const flushTelemetry = jest.fn()
jest.mock('pp365-shared-library/lib/telemetry', () => ({
  ...jest.requireActual('pp365-shared-library/lib/telemetry'),
  flushTelemetry
}))

import { act, render } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import { DISABLE_TELEMETRY_FLAG, TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import resource from 'SharedResources'
import * as React from 'react'
import { ProjectPhasesContext } from './context'
import { ARCHIVE_LOG_FAILED, CHANGE_PHASE_ERROR, HUB_SYNC_FAILED, SET_PHASE } from './reducer'
import { useChangePhase } from './useChangePhase'

/**
 * Changing the phase: the phase is changed on the project whether or not the hub takes it, and a
 * change the hub did not take is reported with the reason, without the reload that would take the
 * warning away. A phase changed on the project is counted once, for the phases web part, and what
 * was counted is sent before the page reloads. The session cache is emptied on the way, all but a
 * tester's switch for usage statistics. Each failure the user is told of (the change itself, the
 * hub that did not take it, the archive log) is counted once as an error, by its code.
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
    <TelemetryProvider component='ProjectPhasesWebPart'>
      <ProjectPhasesContext.Provider
        value={{
          state: { confirmPhase: PLANNING, data: { phaseField: PHASE_FIELD } } as any,
          props: { syncPropertiesAfterPhaseChange: true, webAbsoluteUrl: '/sites/frisbee' } as any,
          dispatch
        }}
      >
        <Probe />
      </ProjectPhasesContext.Provider>
    </TelemetryProvider>
  )
  await act(() => change(archiveLogError))
  return dispatch.mock.calls.map(([action]) => action)
}

beforeEach(() => {
  jest.useFakeTimers()
  adapter.updateProjectPhase.mockReset()
  flushTelemetry.mockReset()
  startTestTelemetry()
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
  sessionStorage.clear()
})

describe('useChangePhase', () => {
  it('changes the phase, on the project and in the hub, and reloads the page', async () => {
    adapter.updateProjectPhase.mockResolvedValue(null)
    const actions = await changePhase()
    expect(adapter.updateProjectPhase).toHaveBeenCalledWith(PLANNING, PHASE_FIELD)
    expect(actions).toContainEqual(SET_PHASE({ phase: PLANNING as any }))
    expect(actions.some(({ type }) => type === HUB_SYNC_FAILED.type)).toBe(false)
    expect(jest.getTimerCount()).toBe(1)
    expect(countedTelemetry().usage).toEqual({ 'ProjectPhasesWebPart phase.changed': 1 })
    expect(countedTelemetry().errors).toEqual({})
  })

  it('sends what was counted before it reloads the page', async () => {
    adapter.updateProjectPhase.mockResolvedValue(null)
    await changePhase()
    expect(flushTelemetry).not.toHaveBeenCalled()
    // jsdom cannot navigate, and reports the reload as an error: only that is swallowed.
    // eslint-disable-next-line no-console
    const original = console.error
    const consoleError = jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
      if (String(args[0]?.message ?? args[0]).includes('Not implemented: navigation')) return
      original(...args)
    })
    try {
      jest.runOnlyPendingTimers()
    } finally {
      consoleError.mockRestore()
    }
    expect(flushTelemetry.mock.calls).toEqual([[{ urgent: true }]])
  })

  it("empties the session cache, and keeps a tester's switch for usage statistics", async () => {
    // Emptied with the rest, the tab would send again from the reload that follows.
    sessionStorage.setItem('pp365_project_properties', '{"GtProjectPhase":"Konsept"}')
    sessionStorage.setItem(DISABLE_TELEMETRY_FLAG, '1')
    sessionStorage.setItem('pp365_phases', '[]')
    const setItem = jest.spyOn(Storage.prototype, 'setItem')
    adapter.updateProjectPhase.mockResolvedValue(null)
    try {
      await changePhase()
      expect(setItem).not.toHaveBeenCalled()
    } finally {
      setItem.mockRestore()
    }
    expect(sessionStorage).toHaveLength(1)
    expect(sessionStorage.getItem(DISABLE_TELEMETRY_FLAG)).toBe('1')
  })

  it('empties the session cache of a tab without the switch', async () => {
    sessionStorage.setItem('pp365_project_properties', '{"GtProjectPhase":"Konsept"}')
    sessionStorage.setItem('pp365_phases', '[]')
    adapter.updateProjectPhase.mockResolvedValue(null)
    await changePhase()
    expect(sessionStorage).toHaveLength(0)
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
    // The phase is changed on the project all the same, and is counted.
    expect(countedTelemetry().usage).toEqual({ 'ProjectPhasesWebPart phase.changed': 1 })
    // So is the hub's refusal, once, by its code.
    expect(countedTelemetry().errors).toEqual({ 'ProjectPhasesWebPart permission_denied 403': 1 })
    expect(flushTelemetry).not.toHaveBeenCalled()
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
    expect(countedTelemetry().usage).toEqual({ 'ProjectPhasesWebPart phase.changed': 1 })
    expect(countedTelemetry().errors).toEqual({ 'ProjectPhasesWebPart permission_denied 403': 1 })
  })

  it('counts the hub and the archive log each by its own error when both fail', async () => {
    adapter.updateProjectPhase.mockResolvedValue(
      Object.assign(new Error('Too many requests'), { status: 429 })
    )
    const actions = await changePhase(
      Object.assign(new Error('Access is denied.'), { status: 403 })
    )
    expect(actions.map(({ type }) => type)).toEqual(
      expect.arrayContaining([ARCHIVE_LOG_FAILED.type, HUB_SYNC_FAILED.type])
    )
    expect(countedTelemetry().errors).toEqual({
      'ProjectPhasesWebPart permission_denied 403': 1,
      'ProjectPhasesWebPart throttled 429': 1
    })
  })

  it('fails the change when the phase cannot be changed on the project, and counts the error once', async () => {
    adapter.updateProjectPhase.mockRejectedValue(
      Object.assign(new Error('Listen finnes ikke'), { status: 404 })
    )
    const actions = await changePhase()
    expect(actions.some(({ type }) => type === SET_PHASE.type)).toBe(false)
    expect(actions).toContainEqual(
      CHANGE_PHASE_ERROR({ error: new Error(strings.ProjectPhasesChangePhaseError) })
    )
    expect(countedTelemetry().usage).toEqual({})
    // By the status of the error SharePoint gave, not by the generic text the dialog shows.
    expect(countedTelemetry().errors).toEqual({ 'ProjectPhasesWebPart not_found 404': 1 })
  })
})
