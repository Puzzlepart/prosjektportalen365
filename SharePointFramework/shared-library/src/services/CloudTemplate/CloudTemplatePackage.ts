import { Schema } from 'sp-js-provisioning'
import type JSZip from 'jszip'
import { IPackageManifest } from '../../models/IPackageManifest'

/**
 * Shape of a `Lists[].DataRows` block in a (hub) provisioning schema. Mirrors
 * the `IDataRows` interface added to the sp-js-provisioning fork.
 */
export interface IPackageDataRows {
  KeyColumn?: string
  UpdateBehavior?: 'Overwrite' | 'Skip'
  Rows: Array<Record<string, any>>
}

/**
 * In-memory reader for a downloaded `.pppkg` (a ZIP with files at the root),
 * used to resolve a **skymal** (cloud template) entirely from its package — the
 * project template schema, the bundled extension schemas, and the list-content
 * rows — without touching the hub.
 *
 * Download/unzip mirrors `PackageInstaller._download`/`_unzip` in
 * PortfolioExtensions; `jszip` is loaded lazily so it stays out of any
 * entrypoint bundle.
 */
export class CloudTemplatePackage {
  private constructor(private _zip: JSZip, public readonly manifest: IPackageManifest) {}

  /**
   * Download a `.pppkg` from `url`, unzip it and parse `manifest.json`.
   *
   * @param url Absolute URL to the `.pppkg` (e.g. the GitHub raw download URL
   * stored in the skymal's `PpPkgSourceUrl`).
   */
  public static async fromUrl(url: string): Promise<CloudTemplatePackage> {
    if (!url) throw new Error('Cloud template package URL is missing')
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) {
      throw new Error(`Failed to download package (HTTP ${response.status} ${response.statusText})`)
    }
    const buffer = await response.arrayBuffer()
    const JSZipModule = (await import('jszip')).default
    const zip = await JSZipModule.loadAsync(buffer)
    const manifestFile = zip.file('manifest.json')
    if (!manifestFile) throw new Error('manifest.json not found in package')
    let manifest: IPackageManifest
    try {
      manifest = JSON.parse(await manifestFile.async('string'))
    } catch {
      throw new Error('manifest.json is not valid JSON')
    }
    return new CloudTemplatePackage(zip, manifest)
  }

  /**
   * Read and parse a JSON file from the package by its relative path.
   */
  public async readJson<T = any>(relativePath: string): Promise<T> {
    const file = this._zip.file(relativePath)
    if (!file) throw new Error(`${relativePath} not found in package`)
    return JSON.parse(await file.async('string')) as T
  }

  /**
   * The bundled project-level provisioning schema (`provisioning.template`),
   * applied to the project web. The hub content type is intentionally NOT
   * injected — the bundled template must define its own project content types.
   */
  public async getProjectTemplateSchema(): Promise<Schema> {
    const path = this.manifest.provisioning?.template
    if (!path) return { Parameters: {} } as Schema
    return this.readJson<Schema>(path)
  }

  /**
   * The bundled schema for one extension file (`provisioning/extensions/*.json`).
   */
  public async getExtensionSchema(file: string): Promise<Schema> {
    return this.readJson<Schema>(file)
  }

  /**
   * The `DataRows` block of the bundled hub-template `Lists[]` entry whose
   * `Title` matches `sourceListTitle` — the rows a skymal copies into the
   * project's destination list. Returns `undefined` when not found.
   */
  public async getHubListDataRows(sourceListTitle: string): Promise<IPackageDataRows | undefined> {
    const path = this.manifest.provisioning?.hubTemplate
    if (!path) return undefined
    const schema = await this.readJson<Schema>(path)
    const list = (schema.Lists ?? []).find((l: any) => l.Title === sourceListTitle)
    return list?.DataRows as IPackageDataRows | undefined
  }
}
