import { TelemetryResolvedSiteType } from 'pp365-shared-library/lib/telemetry'

/**
 * Whether a site of this type has child projects: a program or a parent project.
 *
 * @param siteType The site's type, from `readSiteType` of the shared library
 */
export function isParentSiteType(siteType: TelemetryResolvedSiteType): boolean {
  return siteType === 'program' || siteType === 'parent'
}
