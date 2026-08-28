/**
 * Normalizes a hub site ID to the format used by `legacyPageContext.hubSiteId`:
 * a lowercase GUID without curly braces.
 *
 * Hub site IDs configured manually in the `Provisioning Types` list are often
 * pasted with braces or in upper case, which would otherwise break equality
 * checks against the ID of the hub the current site belongs to.
 *
 * @param hubSiteId Hub site ID in any casing, with or without curly braces
 *
 * @returns The normalized ID, or an empty string if `hubSiteId` is not a
 * non-empty string
 */
export function normalizeHubSiteId(hubSiteId: string): string {
  if (!hubSiteId || typeof hubSiteId !== 'string') return ''
  return hubSiteId.replace(/[{}]/g, '').trim().toLowerCase()
}
