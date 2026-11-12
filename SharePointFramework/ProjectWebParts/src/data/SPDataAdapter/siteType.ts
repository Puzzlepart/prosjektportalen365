import { siteTypeFromTemplate, TelemetryResolvedSiteType } from 'pp365-shared-library/lib/telemetry'

/** The flags of a site's properties item that tell what kind of site it is. */
export interface ISiteTypeFlags {
  GtIsProgram?: boolean
  GtIsParentProject?: boolean
}

/**
 * Reads what kind of site this is from its properties item: a program, a parent project or a
 * project. A program is a parent project too, so `GtIsProgram` wins. A site whose flags cannot be
 * read, such as one without the properties list, is `other`.
 *
 * @param readFlags Reads `GtIsParentProject` and `GtIsProgram` of the site's properties item
 */
export async function readSiteType(
  readFlags: () => Promise<ISiteTypeFlags[]>
): Promise<TelemetryResolvedSiteType> {
  try {
    const [item] = await readFlags()
    return siteTypeFromTemplate({
      isProgram: !!item?.GtIsProgram,
      isParentProject: !!item?.GtIsParentProject
    })
  } catch {
    return 'other'
  }
}

/**
 * Whether a site of this type has child projects: a program or a parent project.
 *
 * @param siteType The site's type, from `readSiteType`
 */
export function isParentSiteType(siteType: TelemetryResolvedSiteType): boolean {
  return siteType === 'program' || siteType === 'parent'
}
