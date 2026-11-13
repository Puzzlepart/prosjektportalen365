import {
  errorCodeFrom,
  setupOutcomeEvent,
  siteTypeFromTemplate,
  TelemetryResolvedSiteType,
  TelemetryVariant,
  trackError,
  trackUsage
} from 'pp365-shared-library/lib/telemetry'
import { isProjectSetupError } from './ProjectSetupError'

/**
 * What the setup counts for usage statistics where the count depends on a condition. The
 * customizer calls these in a straight line, as it calls the shared library, and gains no branch.
 * Like every tracking call they are synchronous and never throw.
 */

/**
 * The kind of site a completed setup leaves behind. The setup writes the selected template's
 * flags to the site's properties, and makes the site a parent project itself when it was run for
 * that (the `parent` variant): the hub's template for a parent project carries no flag of its own.
 *
 * @param template The selected template's flags
 * @param variant The variant of `setup.completed` (`setupVariantFrom`)
 */
export function siteTypeAfterSetup(
  template: { isProgram?: boolean; isParentProject?: boolean } | undefined,
  variant: TelemetryVariant<'setup.completed'>
): TelemetryResolvedSiteType {
  return siteTypeFromTemplate({
    isProgram: template?.isProgram,
    isParentProject: variant === 'parent' || template?.isParentProject
  })
}

/**
 * Counts a setup that stopped before it completed, from the one catch both ways end in. A wizard
 * the user closed is `setup.aborted`, and nothing else. Anything else is `setup.failed` and one
 * error: under the failure's own code and HTTP status when it, or the error it was made from,
 * has one to tell (denied, not found, throttled, a server error, a timeout), and as
 * `provisioning_failed` when it tells nothing.
 *
 * @param aborted Whether the user closed the wizard
 * @param error What the setup's catch caught
 */
export function trackSetupStopped(aborted: boolean, error: unknown): void {
  trackUsage('ProjectSetup', setupOutcomeEvent(aborted))
  if (aborted) return
  trackError('ProjectSetup', errorCodeFrom(error) === 'unknown' ? 'provisioning_failed' : error)
}

/**
 * Counts a failure of what the customizer reads before the setup starts (the site, the hub, the
 * group's members), which it shows in its error dialog. The answers of its own checks (not a site
 * admin, no hub, set up already) are `ProjectSetupError`s: no failure, and not counted.
 *
 * @param error What the customizer's `onInit` caught
 */
export function trackSetupCheckFailure(error: unknown): void {
  if (isProjectSetupError(error)) return
  trackError('ProjectSetup', error)
}
