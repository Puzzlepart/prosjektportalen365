/**
 * The ids of the setup extension (`ProjectSetup` in ProjectExtensions) on each release channel
 * (`channels/*.json`). The site script of a channel puts its own id on a new site, and a channel
 * build does not swap ids in TypeScript, so a site of any channel is known by one of these.
 */
export const PROJECT_SETUP_COMPONENT_IDS: readonly string[] = [
  'ce34553d-ab47-4107-8dd1-e980d953996d',
  '8f20ddfa-4494-493d-93f0-4995afe57e6f',
  'c0c51378-2c43-4e16-a3ed-86f01c6f358e',
  '699fbc90-fe6f-4a5e-9180-86e2d5a70b1e'
]

/** How many of the newest candidate groups are looked up, at up to three requests each. */
export const AWAITING_SETUP_CANDIDATE_LIMIT = 10

/** A group the user owns, as Microsoft Graph gives it. */
export interface IOwnedGroup {
  id: string
  displayName: string
  createdDateTime?: string
  groupTypes?: string[]
}

/** What is read from a candidate group's site to tell whether it awaits the setup. */
export interface IGroupSiteProbe {
  /** The site's absolute URL. */
  url: string
  siteId: string
  /** The hub the site is associated with; the empty guid for none. */
  hubSiteId: string
  /** The `ClientSideComponentId` of each custom action on the site's web. */
  customActionComponentIds: string[]
}

/** A site created for a project that the setup has not been run on. */
export interface IAwaitingSetupSite {
  groupId: string
  siteId: string
  title: string
  url: string
}

/** A guid as it compares: without braces, in lower case. */
function normalizeGuid(guid?: string): string {
  return (guid ?? '').replace(/[{}]/g, '').toLowerCase()
}

/**
 * The groups that may be projects awaiting the setup: Microsoft 365 groups created within
 * `maxAgeDays` that no item of the hub's Projects list belongs to, newest first and at most
 * {@link AWAITING_SETUP_CANDIDATE_LIMIT}. None when `maxAgeDays` is not a positive number.
 *
 * @param groups The groups the user owns
 * @param projectGroupIds The `GtGroupId` of every item of the Projects list
 * @param maxAgeDays How old a group can be, in days
 * @param now The current time
 */
export function selectAwaitingSetupCandidates(
  groups: IOwnedGroup[],
  projectGroupIds: string[],
  maxAgeDays: number,
  now: Date = new Date()
): IOwnedGroup[] {
  if (!(maxAgeDays > 0)) return []
  const oldest = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000
  const projects = new Set(projectGroupIds.map(normalizeGuid))
  return groups
    .filter((group) => (group.groupTypes ?? []).some((type) => type.toLowerCase() === 'unified'))
    .filter((group) => !projects.has(normalizeGuid(group.id)))
    .filter((group) => {
      const created = Date.parse(group.createdDateTime ?? '')
      return !isNaN(created) && created >= oldest
    })
    .sort((a, b) => Date.parse(b.createdDateTime) - Date.parse(a.createdDateTime))
    .slice(0, AWAITING_SETUP_CANDIDATE_LIMIT)
}

/**
 * Whether a group's site awaits the setup: it is associated with the hub and still carries the
 * setup extension, which the setup removes when it has run. A site joined to the hub that was
 * not made for a project has no such extension, and is left out.
 *
 * @param probe What was read from the site; nothing when it could not be read
 * @param hubSiteId The id of the hub's site
 */
export function isAwaitingSetup(probe: IGroupSiteProbe | undefined, hubSiteId: string): boolean {
  if (!probe?.url) return false
  if (normalizeGuid(probe.hubSiteId) !== normalizeGuid(hubSiteId)) return false
  if (normalizeGuid(probe.siteId) === normalizeGuid(hubSiteId)) return false
  return probe.customActionComponentIds.some((id) =>
    PROJECT_SETUP_COMPONENT_IDS.includes(normalizeGuid(id))
  )
}

/**
 * The sites, of the candidate groups, that await the setup. A site that cannot be read (not
 * provisioned yet, or an error) is left out and never fails the others.
 *
 * @param candidates The groups from {@link selectAwaitingSetupCandidates}
 * @param hubSiteId The id of the hub's site
 * @param probeSite Reads a group's site; resolves nothing when the group has no ready site
 */
export async function findSitesAwaitingSetup(
  candidates: IOwnedGroup[],
  hubSiteId: string,
  probeSite: (groupId: string) => Promise<IGroupSiteProbe | undefined>
): Promise<IAwaitingSetupSite[]> {
  const probes = await Promise.all(
    candidates.map((group) => probeSite(group.id).catch((): undefined => undefined))
  )
  return candidates.reduce<IAwaitingSetupSite[]>((sites, group, index) => {
    const probe = probes[index]
    if (isAwaitingSetup(probe, hubSiteId)) {
      sites.push({
        groupId: group.id,
        siteId: probe.siteId,
        title: group.displayName,
        url: probe.url
      })
    }
    return sites
  }, [])
}
