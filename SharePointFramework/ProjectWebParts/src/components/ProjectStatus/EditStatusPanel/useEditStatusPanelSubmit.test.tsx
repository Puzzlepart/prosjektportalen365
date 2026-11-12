// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter's portal adds and updates the report in the
// hub; `portal` stands in.
const portal = { addStatusReport: jest.fn(), updateStatusReport: jest.fn() }
jest.mock('../../../data', () => ({ __esModule: true, default: { portalDataService: portal } }))

import { act, render } from '@testing-library/react'
import { ICustomEditPanelSubmitProps } from 'pp365-shared-library'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { ProjectStatusContext } from '../context'
import { CLOSE_PANEL, SELECT_REPORT } from '../reducer'
import { useEditStatusPanelSubmit } from './useEditStatusPanelSubmit'

/**
 * Saving the status panel. Opened for a new report, in whichever report series is selected, it
 * adds the report and then saves the panel's values to it; opened for the selected report it
 * saves the values to that one. Each is counted once when it is done, as created or as edited.
 * A save that fails shows why, counts no usage, and is counted once as an error, by its code.
 */
const NEW_REPORT = { Title: 'Ny statusrapport for Frisbeegolfbane', GtSiteId: 'site-1-bane' }
const DRAFT = { id: 7 } as any
const SAVED = { id: 7, saved: true } as any
const VALUES = { GtStatusBudget: 'I rute' }

/**
 * Renders the panel's submit hook with the page's state; `submit.current` is what it returned
 * last.
 */
function renderSubmit(state: Record<string, any>) {
  const dispatch = jest.fn()
  const submit: { current?: ICustomEditPanelSubmitProps } = {}
  const Probe: React.FC = () => {
    submit.current = useEditStatusPanelSubmit()
    return null
  }
  render(
    <TelemetryProvider component='ProjectStatusWebPart'>
      <ProjectStatusContext.Provider value={{ props: {}, state, dispatch } as any}>
        <Probe />
      </ProjectStatusContext.Provider>
    </TelemetryProvider>
  )
  return { submit, dispatch }
}

/** Saves the panel, as its save button does. */
const save = (submit: { current?: ICustomEditPanelSubmitProps }) =>
  act(() => submit.current.onSubmit({ properties: VALUES } as any))

const newReportPanel = {
  activePanel: { name: 'EditStatusPanel', reportProps: NEW_REPORT, contentId: '0x0100A1' }
}
const editReportPanel = { activePanel: { name: 'EditStatusPanel' }, selectedReport: DRAFT }

describe('useEditStatusPanelSubmit', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    startTestTelemetry()
  })

  it('adds a new report, saves the values to it, and counts it once as created', async () => {
    portal.addStatusReport.mockResolvedValueOnce(DRAFT)
    portal.updateStatusReport.mockResolvedValueOnce(SAVED)
    const { submit, dispatch } = renderSubmit(newReportPanel)
    await save(submit)
    expect(portal.addStatusReport).toHaveBeenCalledWith(NEW_REPORT, '0x0100A1')
    expect(portal.updateStatusReport).toHaveBeenCalledWith(DRAFT, VALUES)
    expect(dispatch.mock.calls).toEqual([
      [SELECT_REPORT({ report: DRAFT })],
      [SELECT_REPORT({ report: SAVED })],
      [CLOSE_PANEL()]
    ])
    expect(countedTelemetry().usage).toEqual({ 'ProjectStatusWebPart statusReport.created': 1 })
    expect(countedTelemetry().errors).toEqual({})
  })

  it('saves the values to the selected report, and counts it once as edited', async () => {
    portal.updateStatusReport.mockResolvedValueOnce(SAVED)
    const { submit, dispatch } = renderSubmit(editReportPanel)
    await save(submit)
    expect(portal.addStatusReport).not.toHaveBeenCalled()
    expect(portal.updateStatusReport).toHaveBeenCalledWith(DRAFT, VALUES)
    expect(dispatch.mock.calls).toEqual([[SELECT_REPORT({ report: SAVED })], [CLOSE_PANEL()]])
    expect(countedTelemetry().usage).toEqual({ 'ProjectStatusWebPart statusReport.edited': 1 })
  })

  it('shows why a new report could not be saved, leaves the panel open and counts the error once', async () => {
    portal.addStatusReport.mockResolvedValueOnce(DRAFT)
    portal.updateStatusReport.mockRejectedValueOnce(
      Object.assign(new Error('Ingen tilgang'), { status: 403 })
    )
    const { submit, dispatch } = renderSubmit(newReportPanel)
    await save(submit)
    expect(submit.current.error).toBe('Ingen tilgang')
    expect(dispatch.mock.calls).toEqual([[SELECT_REPORT({ report: DRAFT })]])
    expect(countedTelemetry().usage).toEqual({})
    expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart permission_denied 403': 1 })
  })

  it('counts a new report that could not be added, by its code', async () => {
    portal.addStatusReport.mockRejectedValueOnce(
      Object.assign(new Error('Tjenesten er ikke tilgjengelig'), { status: 503 })
    )
    const { submit, dispatch } = renderSubmit(newReportPanel)
    await save(submit)
    expect(submit.current.error).toBe('Tjenesten er ikke tilgjengelig')
    expect(portal.updateStatusReport).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart server_error 503': 1 })
  })

  it('shows why the changes could not be saved, leaves the panel open and counts the error once', async () => {
    // A save conflict: the status is kept, and has no code of its own.
    portal.updateStatusReport.mockRejectedValueOnce(
      Object.assign(new Error('Elementet er låst'), { status: 409 })
    )
    const { submit, dispatch } = renderSubmit(editReportPanel)
    await save(submit)
    expect(submit.current.error).toBe('Elementet er låst')
    expect(dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry().usage).toEqual({})
    expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart unknown 409': 1 })
  })
})
