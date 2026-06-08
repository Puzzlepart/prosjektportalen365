import { Logger, LogLevel } from '@pnp/logging'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import '@pnp/sp/files'
import resource from 'SharedResources'
import SPDataAdapter from 'data/SPDataAdapter'
import { ICatalog, ICrossReference, PackageBadge, PpPkgType } from 'models'
import { isNewerVersion } from './version'

/**
 * Metadata stamped into an extension's provisioning JSON when it is imported
 * into the Prosjekttillegg library (see `PackageInstaller`). Lets the catalog
 * detect that an installed extension is outdated.
 */
export interface IPpPackageStamp {
  id: string
  version: string
  extensionId?: string
}

/**
 * Reads catalog-imported extensions back from the hub **Prosjekttillegg**
 * library. Extensions are not tracked in Maloppsett, so the installed version
 * is read from the `PpPackage` stamp inside each uploaded file.
 */
export class ProjectExtensionsService {
  /**
   * Build the catalog↔Prosjekttillegg cross-reference for `extension` packages.
   *
   * Matching is two-tier:
   * 1. **Managed** — a file carrying a `PpPackage` stamp for the package id; the
   *    installed version is known, so `updateAvailable` is a real version diff.
   * 2. **Unmanaged** — a file with no stamp whose Title or filename matches the
   *    package name (e.g. a hand-made "Fasesider" that predates the catalog).
   *    The version is unknown, so it is flagged `unmanaged` and offered as a
   *    replace (the UI confirms before overwriting).
   *
   * Only runs when the catalog contains extension packages. Returns an empty map
   * on any failure (the library may not be provisioned yet).
   */
  public static async getCrossReference(catalog: ICatalog): Promise<Map<string, ICrossReference>> {
    const map = new Map<string, ICrossReference>()
    const extensionPackages = catalog.packages.filter((p) => p.type === 'extension')
    if (extensionPackages.length === 0) return map

    try {
      const installed = await ProjectExtensionsService.getInstalledFiles()
      // Stamped files are catalog-managed; unstamped files are candidates for
      // name-based (unmanaged) matching.
      const parsed = installed.map((f) => {
        const baseName = f.fileName.replace(/\.[^.]+$/, '')
        const names = [f.title, baseName].filter(Boolean).map((n) => n.toLowerCase())
        return { itemId: f.itemId, stamp: f.stamp, names }
      })

      const managed = new Map<string, { itemId: number; version: string }>()
      const unmanaged: { itemId: number; names: string[] }[] = []
      for (const p of parsed) {
        if (p.stamp?.id && p.stamp?.version) {
          managed.set(String(p.stamp.id).toLowerCase(), {
            itemId: p.itemId,
            version: String(p.stamp.version)
          })
        } else {
          unmanaged.push({ itemId: p.itemId, names: p.names })
        }
      }

      for (const pkg of extensionPackages) {
        const id = pkg.id.toLowerCase()
        const inst = managed.get(id)
        if (inst) {
          const updateAvailable = isNewerVersion(pkg.version, inst.version)
          map.set(id, {
            itemId: inst.itemId,
            packageType: PpPkgType.Importert,
            installedVersion: inst.version,
            updateAvailable,
            badge: updateAvailable ? PackageBadge.UpdateAvailable : PackageBadge.Installed
          })
          continue
        }
        // Fallback: an unstamped file sharing this package's name.
        const match = unmanaged.find((u) => u.names.includes(pkg.name.toLowerCase()))
        if (match) {
          map.set(id, {
            itemId: match.itemId,
            packageType: PpPkgType.Importert,
            installedVersion: '',
            updateAvailable: false,
            badge: PackageBadge.Installed,
            unmanaged: true
          })
        }
      }
    } catch (error) {
      Logger.log({
        message: `(ProjectExtensionsService) getCrossReference failed: ${error?.message}`,
        level: LogLevel.Warning
      })
    }
    return map
  }

  /**
   * Read all files in the hub Prosjekttillegg library with their `PpPackage`
   * stamp (when present). Shared by {@link getCrossReference} and the pre-import
   * compatibility check.
   */
  public static async getInstalledFiles(): Promise<
    Array<{ itemId: number; title: string; fileName: string; fileRef: string; stamp?: IPpPackageStamp }>
  > {
    const web = SPDataAdapter.portalDataService.web
    const items: { Id: number; FileRef: string; FileLeafRef: string; Title: string }[] =
      await web.lists
        .getByTitle(resource.Lists_ProjectExtensions_Title)
        .items.select('Id', 'FileRef', 'FileLeafRef', 'Title')
        .top(500)()
    return Promise.all(
      items.map(async (item) => {
        let stamp: IPpPackageStamp | undefined
        try {
          stamp = JSON.parse(await web.getFileByServerRelativePath(item.FileRef).getText())?.PpPackage
        } catch {
          // Not JSON / unreadable — treat as unstamped.
        }
        return {
          itemId: item.Id,
          title: item.Title ?? '',
          fileName: item.FileLeafRef ?? '',
          fileRef: item.FileRef,
          stamp
        }
      })
    )
  }
}
