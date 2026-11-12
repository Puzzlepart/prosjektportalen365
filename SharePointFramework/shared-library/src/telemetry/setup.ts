import { TelemetrySiteType, TelemetryVariant } from './contract'

/** The `forceTemplate` value of «Kjør oppsettveiviser»: the setup is run again on a set-up site. */
const SELECT_TEMPLATE = '__SELECT_TEMPLATE__'

/**
 * The event for a project setup that did not complete. Closing the setup dialog rejects into the
 * same catch as a failure, so the caller says which of the two it was.
 *
 * @param aborted Whether the user closed the setup
 */
export function setupOutcomeEvent(aborted: boolean): 'setup.aborted' | 'setup.failed' {
  return aborted ? 'setup.aborted' : 'setup.failed'
}

/**
 * The variant of `setup.completed` from the extension's `forceTemplate` property: none for a new
 * site, the template chooser's token when the setup is run again, and a template's name when the
 * site is made a parent project.
 *
 * @param forceTemplate The `forceTemplate` property of ProjectSetup
 */
export function setupVariantFrom(forceTemplate?: string): TelemetryVariant<'setup.completed'> {
  if (!forceTemplate) return 'new'
  return forceTemplate === SELECT_TEMPLATE ? 'rerun' : 'parent'
}

/**
 * The site type a site gets from the template it is set up with.
 *
 * @param template The selected template's flags
 */
export function siteTypeFromTemplate(template?: {
  isProgram?: boolean
  isParentProject?: boolean
}): Exclude<TelemetrySiteType, 'hub' | 'other'> {
  if (template?.isProgram) return 'program'
  return template?.isParentProject ? 'parent' : 'project'
}
