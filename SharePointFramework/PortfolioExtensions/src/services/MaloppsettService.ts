import { Logger, LogLevel } from '@pnp/logging'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import resource from 'SharedResources'
import SPDataAdapter from 'data/SPDataAdapter'
import {
  ICatalog,
  ICatalogPackage,
  ICrossReference,
  ISPMaloppsettItem,
  MaloppsettTemplate,
  PackageBadge,
  PpPkgType
} from 'models'
import { isNewerVersion } from './version'

/**
 * The Maloppsett list (`PROJECT_TEMPLATE_CONFIGURATION`) requires the
 * `GtProjectTemplate` lookup. Imported/central catalog items have no local
 * project template to point at, so they reference this sentinel (the standard
 * template, id 1) and are distinguished by `PpPkgType`. The real linkage is
 * Phase 3 (setup wizard) work.
 */
const SENTINEL_PROJECT_TEMPLATE_ID = 1

const SELECT_FIELDS = [
  'Id',
  'Title',
  'PpPkgType',
  'PpPkgId',
  'PpPkgVersion',
  'PpPkgSourceUrl',
  'PpPkgInstalledDate',
  'PpPkgUpdatedDate',
  'PpPkgLatestVersion'
]

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Reads and writes Maloppsett items and is the single owner of the
 * catalog↔Maloppsett cross-reference used to derive card/detail badges.
 */
export class MaloppsettService {
  /**
   * Read all Maloppsett items (from the hub web) with the package fields.
   * Returns an empty array if the list/fields are not provisioned yet.
   */
  public static async getItems(): Promise<MaloppsettTemplate[]> {
    try {
      const items: ISPMaloppsettItem[] = await SPDataAdapter.portalDataService.web.lists
        .getByTitle(resource.Lists_TemplateOptions_Title)
        .items.select(...SELECT_FIELDS)
        .top(500)()
      return items.map((item) => new MaloppsettTemplate(item))
    } catch (error) {
      Logger.log({
        message: `(MaloppsettService) getItems failed (fields not provisioned yet?): ${error?.message}`,
        level: LogLevel.Warning
      })
      return []
    }
  }

  /**
   * Build the cross-reference map (keyed by normalized package id) used by the
   * UI to render `Importert`/`Sentral`/"Oppdatering tilgjengelig" badges.
   * Only linked items (with a `PpPkgId`) participate.
   */
  public static buildCrossReference(
    items: MaloppsettTemplate[],
    catalog: ICatalog
  ): Map<string, ICrossReference> {
    const map = new Map<string, ICrossReference>()
    for (const item of items) {
      if (!item.isLinked) continue
      const pkg = catalog.packages.find((p) => p.id.toLowerCase() === item.normalizedPackageId)
      const latestVersion = pkg?.version ?? item.latestVersion
      const updateAvailable = latestVersion
        ? isNewerVersion(latestVersion, item.version)
        : false
      let badge = PackageBadge.None
      if (item.packageType === PpPkgType.Sentral) {
        badge = PackageBadge.Central
      } else if (item.packageType === PpPkgType.Importert) {
        badge = updateAvailable ? PackageBadge.UpdateAvailable : PackageBadge.Installed
      }
      map.set(item.normalizedPackageId, {
        itemId: item.id,
        packageType: item.packageType,
        installedVersion: item.version,
        updateAvailable,
        badge
      })
    }
    return map
  }

  /**
   * Create/refresh the Maloppsett item for an imported package (Mode A).
   */
  public static async upsertImported(pkg: ICatalogPackage, existingItemId?: number): Promise<void> {
    const properties: Record<string, any> = {
      Title: pkg.name,
      GtProjectTemplateId: SENTINEL_PROJECT_TEMPLATE_ID,
      PpPkgType: PpPkgType.Importert,
      PpPkgId: pkg.id,
      PpPkgVersion: pkg.version,
      PpPkgLatestVersion: pkg.version,
      PpPkgSourceUrl: { Url: pkg.downloadUrl, Description: pkg.name },
      PpPkgUpdatedDate: nowIso()
    }
    if (existingItemId) {
      await SPDataAdapter.portalDataService.updateItemInList(
        'PROJECT_TEMPLATE_CONFIGURATION',
        existingItemId,
        properties
      )
    } else {
      await SPDataAdapter.portalDataService.addItemToList('PROJECT_TEMPLATE_CONFIGURATION', {
        ...properties,
        PpPkgInstalledDate: nowIso()
      })
    }
  }

  /**
   * Register a central "skymal" (Mode B) — metadata only, no provisioning.
   */
  public static async createCentral(pkg: ICatalogPackage, sourceUrl?: string): Promise<void> {
    await SPDataAdapter.portalDataService.addItemToList('PROJECT_TEMPLATE_CONFIGURATION', {
      Title: pkg.name,
      GtProjectTemplateId: SENTINEL_PROJECT_TEMPLATE_ID,
      PpPkgType: PpPkgType.Sentral,
      PpPkgId: pkg.id,
      PpPkgVersion: pkg.version,
      PpPkgLatestVersion: pkg.version,
      PpPkgSourceUrl: { Url: sourceUrl || pkg.changelogUrl || pkg.downloadUrl, Description: pkg.name },
      PpPkgInstalledDate: nowIso()
    })
  }

  /**
   * Refresh the recorded latest available version for an item (so the update
   * badge survives without the live catalog). Called on catalog load.
   */
  public static async refreshLatestVersion(itemId: number, latestVersion: string): Promise<void> {
    await SPDataAdapter.portalDataService.updateItemInList(
      'PROJECT_TEMPLATE_CONFIGURATION',
      itemId,
      { PpPkgLatestVersion: latestVersion }
    )
  }

  /**
   * Remove a catalog-linked Maloppsett item (never touches provisioned site
   * content).
   */
  public static async remove(itemId: number): Promise<boolean> {
    return SPDataAdapter.portalDataService.deleteItemFromList(
      'PROJECT_TEMPLATE_CONFIGURATION',
      itemId
    )
  }
}
