/** A project as a program knows it: its site, and where that site is. */
export interface IProjectSite {
  siteId: string
  url: string
}

/**
 * The content type of a project's entry in the hub, and of a shielded project's properties item
 * on its own site.
 */
const PROJECT_CONTENT_TYPE_ID = '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C'

/** A site ID compared without braces and case. */
function normalizeSiteId(id: unknown): string {
  return `${id ?? ''}`.replace(/[{}]/g, '').toLowerCase()
}

/**
 * Whether a project site's properties item is a shielded project's. The setup gives it the
 * content type of the hub's entries (or a template's own, built on it) and the site's ID, since a
 * shielded project has no entry in the hub. Every project site has a properties item; those of
 * other projects have neither.
 *
 * @param item The properties item
 * @param siteId ID of the site the item was read from
 */
export function isShieldedProjectItem(
  item: Record<string, any> | undefined,
  siteId: string
): boolean {
  if (!item) return false
  const contentTypeId = `${item.ContentTypeId ?? ''}`.toLowerCase()
  return (
    contentTypeId.startsWith(PROJECT_CONTENT_TYPE_ID.toLowerCase()) &&
    !!normalizeSiteId(siteId) &&
    normalizeSiteId(item.GtSiteId) === normalizeSiteId(siteId)
  )
}

/**
 * The properties items of the shielded projects among a program's projects, read from each
 * project's own site: the hub's list has no entry for a shielded project, so the hub alone leaves
 * it out of the program's project list, timeline and aggregations. Only projects with no item
 * among the hub's are read, each once. A project that is missing there but not shielded (a closed
 * one, which the hub's query leaves out), a site the user may not read and a read that fails all
 * give no item and leave the others in.
 *
 * @param sites The program's projects
 * @param hubItems The projects read from the hub
 * @param readItem Reads the properties item of a project site
 */
export async function fetchShieldedProjectItems<T extends { GtSiteId?: string }>(
  sites: IProjectSite[],
  hubItems: T[],
  readItem: (url: string) => Promise<Record<string, any> | undefined>
): Promise<T[]> {
  const inHub = new Set((hubItems ?? []).map((item) => normalizeSiteId(item?.GtSiteId)))
  const asked = new Set<string>()
  const candidates = (sites ?? []).filter((site) => {
    const id = normalizeSiteId(site?.siteId)
    if (!id || !site.url || inHub.has(id) || asked.has(id)) return false
    asked.add(id)
    return true
  })
  const items = await Promise.all(
    candidates.map(async (site) => {
      try {
        const item = await readItem(site.url)
        if (!isShieldedProjectItem(item, site.siteId)) return undefined
        // The hub's entries name the site; so does a shielded project's item, from its setup.
        return { ...item, GtSiteUrl: item.GtSiteUrl || site.url } as unknown as T
      } catch {
        return undefined
      }
    })
  )
  return items.filter(Boolean)
}
