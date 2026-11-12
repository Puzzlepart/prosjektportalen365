import { TELEMETRY_EVENTS, TELEMETRY_SITE_TYPES } from './contract'
import { setupOutcomeEvent, setupVariantFrom, siteTypeFromTemplate } from './setup'

/**
 * The three mappings ProjectSetup needs live here, so the extension itself gains no branches: it
 * calls them straight through.
 */
describe('the project setup helpers', () => {
  it('setupOutcomeEvent tells a closed dialog from a failure', () => {
    expect(setupOutcomeEvent(true)).toBe('setup.aborted')
    expect(setupOutcomeEvent(false)).toBe('setup.failed')
    expect(setupOutcomeEvent(undefined)).toBe('setup.failed')
    expect(TELEMETRY_EVENTS).toHaveProperty(['setup.aborted'])
    expect(TELEMETRY_EVENTS).toHaveProperty(['setup.failed'])
  })

  it('setupVariantFrom reads the kind of setup off the forceTemplate property', () => {
    expect(setupVariantFrom(undefined)).toBe('new')
    expect(setupVariantFrom('')).toBe('new')
    expect(setupVariantFrom(null)).toBe('new')
    expect(setupVariantFrom('__SELECT_TEMPLATE__')).toBe('rerun')
    expect(setupVariantFrom('Overordnet prosjekt')).toBe('parent')
    expect(setupVariantFrom('Standardmal')).toBe('parent')
  })

  it('setupVariantFrom gives variants of setup.completed only', () => {
    const variants: readonly string[] = TELEMETRY_EVENTS['setup.completed'].variants
    ;[undefined, '', '__SELECT_TEMPLATE__', 'Programmal'].forEach((forceTemplate) =>
      expect(variants).toContain(setupVariantFrom(forceTemplate))
    )
  })

  it("siteTypeFromTemplate reads the site type off the template's flags", () => {
    expect(siteTypeFromTemplate({ isProgram: true, isParentProject: false })).toBe('program')
    expect(siteTypeFromTemplate({ isProgram: false, isParentProject: true })).toBe('parent')
    expect(siteTypeFromTemplate({ isProgram: false, isParentProject: false })).toBe('project')
    // A program template that is also flagged as a parent is a program, as the hub lists it.
    expect(siteTypeFromTemplate({ isProgram: true, isParentProject: true })).toBe('program')
    expect(siteTypeFromTemplate({})).toBe('project')
    expect(siteTypeFromTemplate(undefined)).toBe('project')
    expect(siteTypeFromTemplate(null)).toBe('project')
    expect(TELEMETRY_SITE_TYPES).toContain(siteTypeFromTemplate({ isProgram: true }))
  })
})
