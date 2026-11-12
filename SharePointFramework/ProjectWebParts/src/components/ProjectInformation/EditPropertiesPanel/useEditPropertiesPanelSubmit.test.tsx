// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter saves the properties on the project
// (`adapter.project.updateProjectProperties`), and the sync to the hub (tested by itself) is
// `syncProperties`.
const adapter = { project: { updateProjectProperties: jest.fn() } }
jest.mock('../../../data', () => ({ __esModule: true, default: adapter }))
const syncProperties = jest.fn()
jest.mock('../usePropertiesSync', () => ({ usePropertiesSync: () => syncProperties }))

import { act, render } from '@testing-library/react'
import { ICustomEditPanelSubmitProps } from 'pp365-shared-library/lib/components/CustomEditPanel/types'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { ProjectInformationContextProvider } from '../context'
import { CLOSE_PANEL, UPDATE_DATA } from '../reducer'
import { useEditPropertiesPanelSubmit } from './useEditPropertiesPanelSubmit'

/**
 * Saving the project properties panel: the properties are saved on the project and synced to the
 * hub, the web part gets the new data and the panel closes. A completed save is counted once, for
 * the project information web part; a save or a sync that fails shows why, counts no usage, and is
 * counted once as an error, by its code.
 */
const DATA = { fieldValues: {}, templateParameters: {} } as any

/**
 * Renders the panel's submit hook; `submit.current` is what it returned last.
 */
function renderSubmit() {
  const dispatch = jest.fn()
  const submit: { current?: ICustomEditPanelSubmitProps } = {}
  const Probe: React.FC = () => {
    submit.current = useEditPropertiesPanelSubmit()
    return null
  }
  render(
    <TelemetryProvider component='ProjectInformationWebPart'>
      <ProjectInformationContextProvider
        value={{ props: { webTitle: 'Frisbeegolfbane' }, state: {}, dispatch } as any}
      >
        <Probe />
      </ProjectInformationContextProvider>
    </TelemetryProvider>
  )
  return { submit, dispatch }
}

/** Saves the panel, as its save button does. */
const save = (submit: { current?: ICustomEditPanelSubmitProps }) =>
  act(() => submit.current.onSubmit({ properties: { GtProjectGoals: 'Atten hull' } } as any))

describe('useEditPropertiesPanelSubmit', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.useFakeTimers()
    startTestTelemetry()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('saves the properties, syncs them to the hub, closes the panel and counts the edit once', async () => {
    adapter.project.updateProjectProperties.mockResolvedValueOnce(DATA)
    syncProperties.mockResolvedValueOnce(undefined)
    const { submit, dispatch } = renderSubmit()
    await save(submit)
    expect(adapter.project.updateProjectProperties).toHaveBeenCalledWith(
      { GtProjectGoals: 'Atten hull', Title: 'Frisbeegolfbane' },
      true
    )
    expect(syncProperties).toHaveBeenCalledWith(
      expect.objectContaining({ syncList: true, syncPropertyItemToHub: true, data: DATA })
    )
    expect(dispatch.mock.calls).toEqual([[UPDATE_DATA({ data: DATA })], [CLOSE_PANEL()]])
    expect(submit.current).toMatchObject({ error: null, saveProgressText: null })
    expect(countedTelemetry().usage).toEqual({ 'ProjectInformationWebPart properties.edited': 1 })
    expect(countedTelemetry().errors).toEqual({})
  })

  it('shows why the properties could not be saved, for a while, and counts the error once', async () => {
    adapter.project.updateProjectProperties.mockRejectedValueOnce(
      Object.assign(new Error('Ingen tilgang'), { status: 403 })
    )
    const { submit, dispatch } = renderSubmit()
    await save(submit)
    expect(submit.current.error).toBe(
      `${strings.UpdatingProjectPropertiesErrorText}\n\nIngen tilgang`
    )
    expect(syncProperties).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry().usage).toEqual({})
    expect(countedTelemetry().errors).toEqual({
      'ProjectInformationWebPart permission_denied 403': 1
    })
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(submit.current.error).toBeNull()
  })

  it('shows why the properties could not be synced, leaves the panel open and counts the error once', async () => {
    adapter.project.updateProjectProperties.mockResolvedValueOnce(DATA)
    syncProperties.mockRejectedValueOnce(
      Object.assign(new Error('Listen finnes ikke'), { status: 404 })
    )
    const { submit, dispatch } = renderSubmit()
    await save(submit)
    expect(submit.current.error).toBe(
      `${strings.SynchronizingProjectPropertiesToPortfolioSiteErrorText}\n\nListen finnes ikke`
    )
    expect(dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry().usage).toEqual({})
    expect(countedTelemetry().errors).toEqual({ 'ProjectInformationWebPart not_found 404': 1 })
  })
})
