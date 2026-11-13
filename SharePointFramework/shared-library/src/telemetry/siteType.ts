import { siteTypeFromTemplate } from './setup'
import { TelemetryResolvedSiteType } from './siteInfo'

/**
 * The flags that tell what kind of site a project site is. They are on the site's own properties
 * item and on its row in the hub's Prosjekter list.
 */
export interface ISiteTypeFlags {
  GtIsProgram?: boolean
  GtIsParentProject?: boolean
}

/**
 * Reads what kind of site a site is from the item that holds its flags, with the one mapping
 * every site type resolver uses: a program, a parent project or a project. A program is a parent
 * project too, so `GtIsProgram` wins. A read that fails gives `other`, as on a site without the
 * list.
 *
 * @param readFlags Reads `GtIsProgram` and `GtIsParentProject` of the site's item
 * @param whenMissing The answer when there is no such item: a project where the site's own
 * properties item is read (it is not there yet), `other` where the hub's list is (the site is no
 * project of the hub)
 */
export async function readSiteType(
  readFlags: () => Promise<ISiteTypeFlags[]>,
  whenMissing: TelemetryResolvedSiteType = 'project'
): Promise<TelemetryResolvedSiteType> {
  try {
    const [item] = await readFlags()
    if (!item) return whenMissing
    return siteTypeFromTemplate({
      isProgram: !!item.GtIsProgram,
      isParentProject: !!item.GtIsParentProject
    })
  } catch {
    return 'other'
  }
}
