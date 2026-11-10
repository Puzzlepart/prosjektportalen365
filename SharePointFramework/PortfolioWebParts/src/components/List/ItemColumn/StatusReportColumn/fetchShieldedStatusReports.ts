import { spfi } from '@pnp/sp'
import '@pnp/sp/search'
import '@pnp/sp/sites'
import { IWeb } from '@pnp/sp/webs'

/**
 * A status column in `Prosjektkolonner`: the report field and the managed property search has it
 * in.
 */
export interface IStatusColumnItem {
  GtInternalName: string
  GtManagedProperty: string
}

const STATUS_REPORT_CONTENT_TYPE_ID = '0x010022252E35737A413FB56A1BA53862F6D5'

/**
 * `GtModerationStatus` of a published report on Norwegian and English hubs, as in
 * `data/config.ts`, which is not imported: it reads PnPjs' search enums when loaded.
 */
const PUBLISHED = ['Publisert', 'Published']

/**
 * Published status reports of shielded projects, which keep them on their own sites rather than
 * in the hub's list: found by search, trimmed to what the user may read, and returned in the shape
 * of the hub list's items. Only the fields with a column in `Prosjektkolonner` are read, as search
 * knows a field by its managed property. Gives none when search fails, so the hub's reports are
 * still shown.
 *
 * @param web The hub
 * @param columns The status columns in `Prosjektkolonner`
 */
export async function fetchShieldedStatusReports(
  web: IWeb,
  columns: IStatusColumnItem[]
): Promise<Record<string, any>[]> {
  // An unknown property makes search return nothing for all of them.
  const statusColumns = (columns ?? []).filter(
    (column) => column?.GtInternalName && /^\w+$/.test(column.GtManagedProperty ?? '')
  )
  if (statusColumns.length === 0) return []
  try {
    const sp = spfi(web)
    const { Id } = await sp.site.select('Id')<{ Id: string }>()
    const hubSiteId = Id.replace(/[{}]/g, '').toLowerCase()
    const { PrimarySearchResults } = await sp.search({
      // The hub's own reports are read from its list.
      Querytext: `DepartmentId:{${hubSiteId}} ContentTypeId:${STATUS_REPORT_CONTENT_TYPE_ID}* (${PUBLISHED.map((status) => `GtModerationStatusOWSCHCS:${status}`).join(' OR ')}) -SiteId:${hubSiteId}`,
      RowLimit: 500,
      TrimDuplicates: false,
      SelectProperties: [
        'GtSiteIdOWSTEXT',
        'Created',
        'SiteId',
        ...statusColumns.map((column) => column.GtManagedProperty)
      ]
    })
    return (PrimarySearchResults as Record<string, any>[])
      .filter((result) => `${result.SiteId ?? ''}`.toLowerCase() !== hubSiteId)
      .map((result) =>
        statusColumns.reduce<Record<string, any>>(
          (item, column) => {
            item[column.GtInternalName] = result[column.GtManagedProperty]
            return item
          },
          { GtSiteId: result.GtSiteIdOWSTEXT, Created: result.Created }
        )
      )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('(StatusReportColumn) Could not search for the reports of shielded projects.', {
      error
    })
    return []
  }
}
