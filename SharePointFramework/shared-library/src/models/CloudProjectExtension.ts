import { Schema } from 'sp-js-provisioning'
import type { CloudTemplatePackage } from '../services/CloudTemplate/CloudTemplatePackage'
import { IManifestExtension } from './IPackageManifest'
import { ProjectExtension, IProjectExtensionSPItem } from './ProjectExtension'

/**
 * A project extension (prosjekttillegg) that belongs to a **skymal** (cloud
 * template). Unlike {@link ProjectExtension}, its schema is read from the
 * downloaded `.pppkg` instead of the hub Prosjekttillegg library — so it can be
 * applied to a project without the extension existing on the hub.
 */
export class CloudProjectExtension extends ProjectExtension {
  private _file: string
  private _package: CloudTemplatePackage

  /**
   * Build a `CloudProjectExtension` from a manifest extension entry.
   *
   * @param ext Manifest extension entry
   * @param pkg Resolved cloud template package (source of the bundled schema)
   * @param id Synthetic, unique id within the cloud extension set
   */
  public static fromManifest(
    ext: IManifestExtension,
    pkg: CloudTemplatePackage,
    id: number
  ): CloudProjectExtension {
    const spItem: IProjectExtensionSPItem = {
      Id: id,
      File: { UniqueId: '', Name: ext.file, Title: ext.name, ServerRelativeUrl: '' },
      FieldValuesAsText: { GtDescription: ext.description ?? '' },
      GtExtensionDefault: !!ext.defaultSelected,
      GtExtensionHidden: false,
      GtExtensionLocked: false
    }
    const instance = new CloudProjectExtension(spItem, undefined)
    instance._file = ext.file
    instance._package = pkg
    return instance
  }

  /**
   * Returns the bundled extension schema from the `.pppkg` (no hub read).
   */
  public async getSchema(): Promise<Schema> {
    return this._package.getExtensionSchema(this._file)
  }
}
