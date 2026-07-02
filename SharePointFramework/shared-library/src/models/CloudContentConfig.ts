import type {
  CloudTemplatePackage,
  IPackageDataRows
} from '../services/CloudTemplate/CloudTemplatePackage'
import { ContentConfig, IContentConfigSPItem } from './ContentConfig'
import { IManifestListContent } from './IPackageManifest'

/**
 * Base content-type id of the "List Content" (Listeinnhold) content type. Using
 * it (without the Planner `…01` / Timeline `…02` suffix) keeps
 * {@link ContentConfig.type} resolving to `List`.
 */
const LIST_CONTENT_BASE_CT = '0x0100B8B4EE61A547B247B49CFC21B67D5B7D'

/**
 * Normalize the manifest `fields` value for `GtLccFields`. The manifest schema
 * allows `'-'` to mean "no fields"; treat that (and whitespace-only) as an empty
 * string so {@link ContentConfig.fields} resolves to `[]` (copy all columns)
 * instead of the literal `['-']`, which would project empty rows.
 */
function normalizeFields(fields?: string): string {
  const trimmed = (fields ?? '').trim()
  return trimmed === '-' ? '' : trimmed
}

/**
 * A list-content configuration (Listeinnhold) that belongs to a **cloud template**.
 * The rows are read from the bundled `hub-template.json`
 * `Lists[]` entry (via {@link getCloudDataRows}) and applied to the project's
 * destination list — nothing is read from the hub.
 */
export class CloudContentConfig extends ContentConfig {
  private _package: CloudTemplatePackage
  /** Title of the bundled hub list the rows come from (`GtLccSourceList`). */
  public sourceListTitle: string
  /** Title of the project list the rows are copied into (`GtLccDestinationList`). */
  public destinationListTitle: string

  /**
   * Build a `CloudContentConfig` from a manifest list-content entry.
   *
   * @param entry Manifest list-content entry
   * @param pkg Resolved cloud template package (source of the bundled rows)
   * @param id Synthetic, unique id within the cloud content-config set
   */
  public static fromManifest(
    entry: IManifestListContent,
    pkg: CloudTemplatePackage,
    id: number
  ): CloudContentConfig {
    const destinationList = entry.destinationList ?? entry.sourceList
    const spItem: IContentConfigSPItem = {
      ContentTypeId: LIST_CONTENT_BASE_CT,
      Id: id,
      Title: entry.title,
      GtDescription: entry.description ?? '',
      GtLccSourceList: entry.sourceList,
      GtLccDestinationList: destinationList,
      GtLccFields: normalizeFields(entry.fields),
      GtLccDefault: !!entry.default,
      GtLccHidden: !!entry.hidden,
      GtLccLocked: !!entry.locked,
      GtPlannerName: undefined
    }
    const instance = new CloudContentConfig(spItem, undefined, undefined)
    instance._package = pkg
    instance.sourceListTitle = entry.sourceList
    instance.destinationListTitle = destinationList
    return instance
  }

  /**
   * The bundled rows for this config, read from the package's hub-template
   * `Lists[]` entry whose `Title === sourceListTitle`.
   */
  public async getCloudDataRows(): Promise<IPackageDataRows | undefined> {
    return this._package.getHubListDataRows(this.sourceListTitle)
  }
}
