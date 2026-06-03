import { PackageBadge, PpPkgType } from './enums'

/**
 * Result of cross-referencing a catalog package against the Maloppsett list.
 * Produced solely by `MaloppsettService` and consumed read-only by the UI.
 */
export interface ICrossReference {
  /**
   * Id of the matching Maloppsett item.
   */
  itemId: number

  /**
   * Type of the matching item (`Importert` / `Sentral` / `Lokal`).
   */
  packageType: PpPkgType

  /**
   * Version recorded on the Maloppsett item (`PpPkgVersion`).
   */
  installedVersion: string

  /**
   * Whether the catalog version is newer than {@link installedVersion}.
   */
  updateAvailable: boolean

  /**
   * Badge to render on the card/details for this package.
   */
  badge: PackageBadge
}
