import { SPFI } from '@pnp/sp'
import { IWeb } from '@pnp/sp/webs'
import { PpPkgType } from './enums'

/**
 * Raw SharePoint item shape for a Maloppsett (Template Options) list item,
 * limited to the fields this feature cares about.
 */
export interface ISPTemplateOptionsItem {
  Id: number
  Title: string
  PpPkgType?: string
  PpPkgId?: string
  PpPkgVersion?: string
  /** URL field — comes back as `{ Url, Description }` from PnPjs. */
  PpPkgSourceUrl?: { Url: string; Description?: string } | string
  PpPkgInstalledDate?: string
  PpPkgUpdatedDate?: string
  PpPkgLatestVersion?: string
}

/**
 * Model wrapping a Maloppsett item. Constructed by
 * `PortalDataService.getItems(listTitle, TemplateOptionsItem)`.
 *
 * Empty/missing `PpPkgType` is coalesced to {@link PpPkgType.Lokal} because a
 * column default does not backfill pre-existing items on upgrade.
 */
export class TemplateOptionsItem {
  public id: number
  public title: string
  public packageType: PpPkgType
  public packageId: string
  public version: string
  public sourceUrl: string
  public installedDate?: string
  public updatedDate?: string
  public latestVersion: string

  constructor(item: ISPTemplateOptionsItem, public web?: IWeb, public sp?: SPFI) {
    this.id = item.Id
    this.title = item.Title
    this.packageType = (item.PpPkgType as PpPkgType) || PpPkgType.Lokal
    this.packageId = (item.PpPkgId ?? '').trim()
    this.version = item.PpPkgVersion ?? ''
    this.sourceUrl =
      typeof item.PpPkgSourceUrl === 'string' ? item.PpPkgSourceUrl : item.PpPkgSourceUrl?.Url ?? ''
    this.installedDate = item.PpPkgInstalledDate
    this.updatedDate = item.PpPkgUpdatedDate
    this.latestVersion = item.PpPkgLatestVersion ?? ''
  }

  /**
   * Normalized package id used for cross-referencing against the catalog.
   */
  public get normalizedPackageId(): string {
    return this.packageId.toLowerCase()
  }

  /**
   * Whether this item is linked to a catalog package (has a `PpPkgId`).
   */
  public get isLinked(): boolean {
    return this.packageId.length > 0
  }
}
