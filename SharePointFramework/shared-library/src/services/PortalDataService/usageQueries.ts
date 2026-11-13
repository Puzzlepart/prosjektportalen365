/**
 * The hub reads usage statistics make, as queries on a list that is passed in. None of them uses
 * a cache (`.using(...)`): what they read never lands in the browser's storage. The module
 * imports types only, so the runtime contract test loads it with the real PnPjs
 * (`test/runtime/usageQueries.runtime.test.mjs`).
 */
import type { IList } from '@pnp/sp/lists'
import type { ISiteTypeFlags } from '../../telemetry/siteType'

/** The fields read of the newest row of Installasjonslogg, and nothing else of it. */
export interface IInstallationFacts {
  InstallVersion?: string
  InstallChannel?: string
}

/** The flags that count as programs and as parent projects in Prosjekter. */
export type ProjectFlag = 'GtIsProgram' | 'GtIsParentProject'

/** The most rows a count reads: the list view threshold. */
const MAX_COUNTED_ROWS = 5000

/**
 * The newest installation's version and channel: the row of Installasjonslogg with the latest
 * `InstallStartTime`. Who installed and with which command is not selected.
 *
 * @param list The hub's Installasjonslogg
 */
export function readNewestInstallation(list: IList): Promise<IInstallationFacts[]> {
  return list.items
    .select('InstallVersion', 'InstallChannel')
    .orderBy('InstallStartTime', false)
    .top(1)<IInstallationFacts[]>()
}

/**
 * How many rows a list has, from the list's own `ItemCount`: no row is read.
 *
 * @param list The hub's Prosjekter
 */
export async function readItemCount(list: IList): Promise<number> {
  const { ItemCount } = await list.select('ItemCount')<{ ItemCount: number }>()
  return ItemCount
}

/**
 * How many rows of Prosjekter have a flag set. Only the ids are read, at most as many as the list
 * view threshold; in a list beyond it the read fails, and the caller leaves the count out.
 *
 * @param list The hub's Prosjekter
 * @param flag The flag to count
 */
export async function countFlagged(list: IList, flag: ProjectFlag): Promise<number> {
  const flagged = list.items.select('Id').filter(`${flag} eq 1`).top(MAX_COUNTED_ROWS)
  const rows = await flagged<{ Id: number }[]>()
  return rows.length
}

/**
 * The flags of a site's row in Prosjekter, found as `getProjectDetails` finds the row: by
 * `GtSiteId`. A site without a row gives no item.
 *
 * @param list The hub's Prosjekter
 * @param siteId The site's id, a GUID without braces
 */
export function readSiteFlags(list: IList, siteId: string): Promise<ISiteTypeFlags[]> {
  return list.items
    .select('GtIsProgram', 'GtIsParentProject')
    .filter(`GtSiteId eq '${siteId}'`)
    .top(1)<ISiteTypeFlags[]>()
}
