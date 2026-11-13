import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import { isProjectSetupError, ProjectSetupError } from './ProjectSetupError'
import { siteTypeAfterSetup, trackSetupCheckFailure, trackSetupStopped } from './setupTelemetry'

/**
 * What the setup counts where the count depends on a condition: the kind of site a completed setup
 * leaves, the two ways a setup stops, and the reads before it starts. Telemetry is the real one,
 * counting in the window's memory.
 */

/** What PnPjs fails with when SharePoint answers with `status`. */
const httpError = (status: number) => Object.assign(new Error(`[${status}]`), { status })

/** A step's error, as `BaseTaskError` makes it: a text for the user, and what the step failed with. */
const stepError = (failure: unknown) =>
  new ProjectSetupError('SitePermissions', 'Kunne ikke sette tillatelser', failure)

beforeEach(() => startTestTelemetry())

describe('siteTypeAfterSetup', () => {
  it('is what the selected template says', () => {
    expect(siteTypeAfterSetup({ isProgram: false, isParentProject: false }, 'new')).toBe('project')
    expect(siteTypeAfterSetup({ isProgram: true }, 'rerun')).toBe('program')
    expect(siteTypeAfterSetup({ isParentProject: true }, 'rerun')).toBe('parent')
  })

  it('is a parent project when the setup was run to make the site one, though the template has no flag for it', () => {
    expect(siteTypeAfterSetup({}, 'parent')).toBe('parent')
    // A program is a parent project too, and stays a program.
    expect(siteTypeAfterSetup({ isProgram: true }, 'parent')).toBe('program')
  })

  it('is a project for a setup without a template', () => {
    expect(siteTypeAfterSetup(undefined, 'new')).toBe('project')
  })
})

describe('trackSetupStopped', () => {
  it('counts a wizard the user closed as aborted, and nothing else', () => {
    trackSetupStopped(true, new ProjectSetupError('_getProvisioningInfo', 'Avbrutt', '', 'info'))
    expect(countedTelemetry()).toEqual({
      usage: { 'ProjectSetup setup.aborted': 1 },
      errors: {},
      timings: {}
    })
  })

  it('counts a failure that tells nothing as a failed setup and a failed provisioning', () => {
    trackSetupStopped(false, stepError(new Error('Noe gikk galt')))
    trackSetupStopped(false, undefined)
    expect(countedTelemetry()).toEqual({
      usage: { 'ProjectSetup setup.failed': 2 },
      errors: { 'ProjectSetup provisioning_failed': 2 },
      timings: {}
    })
  })

  it('counts a failure by the HTTP status of what the step failed with', () => {
    trackSetupStopped(false, stepError(httpError(403)))
    // sp-js-provisioning's error keeps what the handler failed with as its cause.
    trackSetupStopped(
      false,
      stepError(Object.assign(new Error('Lists'), { cause: httpError(429) }))
    )
    expect(countedTelemetry()).toEqual({
      usage: { 'ProjectSetup setup.failed': 2 },
      errors: {
        'ProjectSetup permission_denied 403': 1,
        'ProjectSetup throttled 429': 1
      },
      timings: {}
    })
  })
})

describe('trackSetupCheckFailure', () => {
  it('counts a read that failed before the setup started by its code', () => {
    // Microsoft Graph's error carries its status as `statusCode`.
    trackSetupCheckFailure(Object.assign(new Error('Forbidden'), { statusCode: 403 }))
    trackSetupCheckFailure(undefined)
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: { 'ProjectSetup permission_denied 403': 1, 'ProjectSetup unknown': 1 },
      timings: {}
    })
  })

  it("counts none of the answers of the setup's own checks", () => {
    trackSetupCheckFailure(new ProjectSetupError('AlreadySetup', 'Allerede satt opp', ''))
    trackSetupCheckFailure(new ProjectSetupError('NoHubConnection', 'Ingen hub', '', 'warning'))
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
  })
})

describe('ProjectSetupError', () => {
  it('is known as a setup error, which no other error or value is', () => {
    expect(isProjectSetupError(stepError('Prøv igjen senere'))).toBe(true)
    expect(isProjectSetupError(new Error('Noe gikk galt'))).toBe(false)
    expect(isProjectSetupError('Noe gikk galt')).toBe(false)
    expect(isProjectSetupError(null)).toBe(false)
    expect(isProjectSetupError(undefined)).toBe(false)
  })

  it('keeps what the setup failed with as its cause, out of a spread and of JSON', () => {
    const failure = httpError(404)
    const error: Error & { cause?: unknown } = stepError(failure)
    expect(error.cause).toBe(failure)
    expect(Object.keys(error)).not.toContain('cause')
    expect(JSON.stringify(error)).not.toContain('404')
  })

  it('keeps the failure it is given as its cause where its stack is a text about it', () => {
    const failure = httpError(503)
    const error: Error & { cause?: unknown } = new ProjectSetupError(
      '_fetchData',
      'Kunne ikke hente data',
      'Prøv igjen senere',
      'error',
      failure
    )
    expect(error.cause).toBe(failure)
    expect(error.stack).toBe('Prøv igjen senere')
  })
})
