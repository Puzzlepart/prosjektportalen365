import { format } from '@fluentui/react/lib/Utilities'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { Logger, LogLevel } from '@pnp/logging'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/folders'
import '@pnp/sp/files'
import '@pnp/sp/items'
import strings from 'PortfolioExtensionsStrings'
import resource from 'SharedResources'
import SPDataAdapter from 'data/SPDataAdapter'
import {
  ICatalogPackage,
  ICompatibilityReport,
  IInstallProgress,
  IInstallStep,
  InstallStepKey,
  InstallStepStatus,
  IPackageManifest
} from 'models'
import { CompatibilityService } from './CompatibilityService'
import { featureFlags } from './featureFlags'
import { TemplateOptionsService } from './TemplateOptionsService'
import { isNewerVersion } from './version'

/**
 * Folder (under the hub Template Library) where imported project-level
 * provisioning assets are stored for later use by the setup wizard (Phase 3).
 */
const PACKAGE_STORE_FOLDER = 'pp-packages'

export interface IPackageInstallOptions {
  package: ICatalogPackage
  context: ListViewCommandSetContext
  featureFlagProvisioning?: boolean
  /**
   * Existing Maloppsett item id when updating an already-imported package.
   */
  existingItemId?: number
  onProgress: (progress: IInstallProgress) => void
  /**
   * Invoked when the pre-import compatibility check finds conflicts. Resolve
   * `true` to continue (conflicting entries are stripped/overwritten per their
   * resolution) or `false` to cancel the import. When omitted, the import
   * proceeds as if confirmed.
   */
  onConflicts?: (report: ICompatibilityReport) => Promise<boolean>
}

/**
 * Mode A — download a `.pppkg`, validate it, then either:
 *
 * - **Extension packages** (`type: extension`): add the extension provisioning
 *   file(s) to the hub **Prosjekttillegg** (Project Extensions) library with
 *   their title/description. Nothing is written to Maloppsett — it is up to the
 *   admin whether to later link the extension to a template there.
 * - **Template/content packages**: provision the hub via the same
 *   `sp-js-provisioning` `WebProvisioner.applyTemplate` flow the template dialog
 *   uses, store the project-level assets for the wizard, and write the Maloppsett
 *   item. The taxonomy step is feature-flag-gated (no Term Store handler in
 *   `sp-js-provisioning` 1.3.7).
 */
export class PackageInstaller {
  public static async runImport(options: IPackageInstallOptions): Promise<boolean> {
    const { package: pkg, context, featureFlagProvisioning, existingItemId, onProgress } = options
    const isExtension = pkg.type === 'extension'

    const steps: IInstallStep[] = (
      isExtension
        ? [
            InstallStepKey.Download,
            InstallStepKey.Unzip,
            InstallStepKey.ValidateManifest,
            InstallStepKey.CheckVersion,
            InstallStepKey.Extensions
          ]
        : [
            InstallStepKey.Download,
            InstallStepKey.Unzip,
            InstallStepKey.ValidateManifest,
            InstallStepKey.CheckVersion,
            InstallStepKey.CheckCompatibility,
            InstallStepKey.ProvisionHub,
            InstallStepKey.Taxonomy,
            InstallStepKey.Extensions,
            InstallStepKey.ListContent,
            InstallStepKey.StoreProjectTemplate,
            InstallStepKey.UpdateTemplateOptions
          ]
    ).map((key) => ({ key, status: 'pending' as InstallStepStatus }))

    const progress: IInstallProgress = { steps, status: 'running' }
    const emit = () => onProgress({ ...progress, steps: steps.map((s) => ({ ...s })) })
    const setStatus = (key: InstallStepKey, status: InstallStepStatus, detail?: string) => {
      const step = steps.find((s) => s.key === key)
      if (step) {
        step.status = status
        if (detail !== undefined) step.detail = detail
      }
      if (status === 'running') progress.currentStep = key
      emit()
    }

    emit()
    try {
      setStatus(InstallStepKey.Download, 'running')
      const buffer = await PackageInstaller._download(pkg.downloadUrl)
      setStatus(InstallStepKey.Download, 'done')

      setStatus(InstallStepKey.Unzip, 'running')
      const zip = await PackageInstaller._unzip(buffer)
      setStatus(InstallStepKey.Unzip, 'done')

      setStatus(InstallStepKey.ValidateManifest, 'running')
      const manifest = await PackageInstaller._readManifest(zip)
      setStatus(InstallStepKey.ValidateManifest, 'done')

      setStatus(InstallStepKey.CheckVersion, 'running')
      const versionDetail = await PackageInstaller._checkVersion(manifest)
      setStatus(InstallStepKey.CheckVersion, 'done', versionDetail)

      if (isExtension) {
        // Extensions are added to the hub Prosjekttillegg library only. Nothing
        // is written to Maloppsett — linking to a template is a later, manual
        // admin choice.
        setStatus(InstallStepKey.Extensions, 'running')
        const added = await PackageInstaller._addProjectExtensions(zip, manifest)
        setStatus(
          InstallStepKey.Extensions,
          'done',
          format(strings.CatalogStepExtensionsDetail, added.length)
        )
        progress.status = 'success'
        progress.currentStep = undefined
        emit()
        return true
      }

      // Pre-import compatibility check: detect conflicts with existing hub
      // objects (content types, site fields, lists, extensions, taxonomy). On
      // conflicts, let the caller confirm; if cancelled, abort before any write.
      setStatus(InstallStepKey.CheckCompatibility, 'running')
      const report = await CompatibilityService.check(zip, manifest, featureFlagProvisioning)
      if (report.hasConflicts) {
        const detail = format(strings.CatalogStepCheckCompatibilityDetail, report.conflicts.length)
        setStatus(InstallStepKey.CheckCompatibility, 'running', detail)
        const proceed = options.onConflicts ? await options.onConflicts(report) : true
        if (!proceed) {
          setStatus(InstallStepKey.CheckCompatibility, 'error', strings.CatalogImportCancelled)
          progress.status = 'error'
          progress.error = strings.CatalogImportCancelled
          progress.currentStep = undefined
          emit()
          return false
        }
        setStatus(InstallStepKey.CheckCompatibility, 'done', detail)
      } else {
        setStatus(InstallStepKey.CheckCompatibility, 'done')
      }

      // Taxonomy is the only feature-flag-gated part. When enabled, the hub
      // schema's `Taxonomy` part is provisioned by the sp-js-provisioning
      // Taxonomy handler as part of `applyTemplate` below; when disabled, it is
      // stripped from the schema so the handler skips it.
      const enableTaxonomy = featureFlags.enableTaxonomyProvisioning({
        featureFlagProvisioning
      })

      setStatus(InstallStepKey.ProvisionHub, 'running')
      await PackageInstaller._provisionHub(zip, manifest, context, enableTaxonomy, report)
      setStatus(InstallStepKey.ProvisionHub, 'done')

      if (!enableTaxonomy) {
        setStatus(InstallStepKey.Taxonomy, 'skipped', strings.CatalogStepSkippedFeatureFlag)
      } else {
        const hasPermission = await SPDataAdapter.hasTermStorePermission()
        setStatus(
          InstallStepKey.Taxonomy,
          hasPermission ? 'done' : 'skipped',
          hasPermission ? undefined : strings.CatalogPermissionError
        )
      }

      // Add the template's bundled project extensions to the Prosjekttillegg
      // library (if any), so they can be linked from the Maloppsett item below.
      let extensionItems: Array<{ extensionId: string; itemId: number; name: string }> = []
      setStatus(InstallStepKey.Extensions, 'running')
      if ((manifest.provisioning?.extensions?.length ?? 0) > 0) {
        extensionItems = await PackageInstaller._addProjectExtensions(zip, manifest)
        setStatus(
          InstallStepKey.Extensions,
          'done',
          format(strings.CatalogStepExtensionsDetail, extensionItems.length)
        )
      } else {
        setStatus(InstallStepKey.Extensions, 'skipped')
      }

      // Create the List Content (Listeinnhold) configs on the hub (if any) and
      // collect their item ids, so the Maloppsett item below can link them via
      // ListContentConfigLookup. Requires the source lists to already exist —
      // they are provisioned by the hub template in ProvisionHub above.
      let listContentItems: Array<{ title: string; itemId: number }> = []
      setStatus(InstallStepKey.ListContent, 'running')
      if ((manifest.provisioning?.listContent?.length ?? 0) > 0) {
        listContentItems = await PackageInstaller._addListContentConfigs(manifest)
        setStatus(
          InstallStepKey.ListContent,
          'done',
          format(strings.CatalogStepListContentDetail, listContentItems.length)
        )
      } else {
        setStatus(InstallStepKey.ListContent, 'skipped')
      }

      setStatus(InstallStepKey.StoreProjectTemplate, 'running')
      const stored = await PackageInstaller._storeProjectFiles(zip, manifest)
      setStatus(InstallStepKey.StoreProjectTemplate, stored ? 'done' : 'skipped')

      setStatus(InstallStepKey.UpdateTemplateOptions, 'running')
      await TemplateOptionsService.upsertImported(pkg, existingItemId, {
        projectContentTypeId: manifest.provisioning?.projectContentTypeId,
        extensionItemIds: extensionItems.map((e) => e.itemId),
        listContentItemIds: listContentItems.map((l) => l.itemId),
        icon: manifest.icon
      })
      setStatus(InstallStepKey.UpdateTemplateOptions, 'done')

      progress.status = 'success'
      progress.currentStep = undefined
      emit()
      return true
    } catch (error) {
      const running = steps.find((s) => s.status === 'running')
      if (running) {
        running.status = 'error'
        running.detail = error?.message
      }
      progress.status = 'error'
      progress.error = error?.message
      emit()
      throw error
    }
  }

  private static async _download(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }
    return response.arrayBuffer()
  }

  private static async _unzip(buffer: ArrayBuffer): Promise<any> {
    const JSZipModule = (await import('jszip')).default
    return JSZipModule.loadAsync(buffer)
  }

  private static async _readManifest(zip: any): Promise<IPackageManifest> {
    const file = zip.file('manifest.json')
    if (!file) throw new Error('manifest.json not found in package')
    let manifest: IPackageManifest
    try {
      manifest = JSON.parse(await file.async('string'))
    } catch {
      throw new Error('manifest.json is not valid JSON')
    }
    if (!manifest.id || !manifest.version || !manifest.type) {
      throw new Error('manifest.json is missing required fields (id, version, type)')
    }
    return manifest
  }

  /**
   * Compares `minPPVersion` against the installed version. Throws when the
   * installation is too old; returns a warning detail when the installed
   * version is unknown (allow-with-warning).
   */
  private static async _checkVersion(manifest: IPackageManifest): Promise<string | undefined> {
    if (!manifest.minPPVersion) return undefined
    const installed = await SPDataAdapter.getInstalledPPVersion()
    if (!installed) {
      return `(?) ${manifest.minPPVersion}`
    }
    if (isNewerVersion(manifest.minPPVersion, installed)) {
      throw new Error(format(strings.CatalogMinVersionError, manifest.minPPVersion))
    }
    return undefined
  }

  private static async _provisionHub(
    zip: any,
    manifest: IPackageManifest,
    context: ListViewCommandSetContext,
    includeTaxonomy: boolean,
    report?: ICompatibilityReport
  ): Promise<void> {
    const hubTemplate = manifest.provisioning?.hubTemplate
    if (!hubTemplate) return
    const file = zip.file(hubTemplate)
    if (!file) {
      throw new Error(`Hub template ${hubTemplate} not found in package`)
    }
    let schema = JSON.parse(await file.async('string'))
    // Gate the (sp-js-provisioning) Taxonomy handler: strip the Taxonomy part
    // when the feature flag is off so term-store provisioning is skipped.
    if (!includeTaxonomy && schema.Taxonomy) {
      delete schema.Taxonomy
    }
    // Strip the entries the admin chose to skip (id clashes that would clobber a
    // different object, or blocked items that would abort applyTemplate), so the
    // existing hub objects are left untouched and the rest still provisions.
    if (report?.hasConflicts) {
      schema = CompatibilityService.stripConflicts(schema, report)
    }
    // Lazy import keeps sp-js-provisioning out of the command-set entrypoint.
    const { WebProvisioner } = await import('sp-js-provisioning')
    const provisioner = new WebProvisioner(SPDataAdapter.portalDataService.web).setup({
      spfxContext: context,
      logging: { prefix: '(TemplatePackageCatalog)', activeLogLevel: LogLevel.Info }
    } as any)
    await provisioner.applyTemplate(schema, null, (handler) => {
      Logger.log({
        message: `(PackageInstaller) provisionHub: applying handler ${handler}`,
        level: LogLevel.Info
      })
    })
  }

  /**
   * Best-effort: persist the project-level provisioning assets (template,
   * extensions, content) into a folder under the hub Template Library so the
   * setup wizard can use them later. Non-critical — returns false on failure.
   */
  private static async _storeProjectFiles(zip: any, manifest: IPackageManifest): Promise<boolean> {
    try {
      const web = SPDataAdapter.portalDataService.web
      const root = await web.lists
        .getByTitle(resource.Lists_TemplateLibrary_Title)
        .rootFolder.select('ServerRelativeUrl')()
      const baseUrl = `${root.ServerRelativeUrl}/${PACKAGE_STORE_FOLDER}`
      await PackageInstaller._ensureFolder(web, root.ServerRelativeUrl, PACKAGE_STORE_FOLDER)
      await PackageInstaller._ensureFolder(web, baseUrl, manifest.id)
      const folderUrl = `${baseUrl}/${manifest.id}`

      const relativePaths: string[] = []
      if (manifest.provisioning?.template) relativePaths.push(manifest.provisioning.template)
      for (const ext of manifest.provisioning?.extensions ?? []) relativePaths.push(ext.file)
      for (const item of manifest.content?.items ?? []) relativePaths.push(item.sourceFile)

      let storedAny = false
      for (const relativePath of relativePaths) {
        const zipFile = zip.file(relativePath)
        if (!zipFile) continue
        const content = await zipFile.async('string')
        const fileName = relativePath.split('/').pop() as string
        await web
          .getFolderByServerRelativePath(folderUrl)
          .files.addUsingPath(fileName, content, { Overwrite: true })
        storedAny = true
      }
      return storedAny
    } catch (error) {
      Logger.log({
        message: `(PackageInstaller) storeProjectFiles failed: ${error?.message}`,
        level: LogLevel.Warning
      })
      return false
    }
  }

  /**
   * Upload the package's extension provisioning file(s) into the hub
   * **Prosjekttillegg** (Project Extensions) document library, setting the
   * `Title` and description (`GtDescription`) on each, plus `GtExtensionDefault`
   * from the manifest's `defaultSelected`. Re-import overwrites the file by name.
   * Returns the created/updated Prosjekttillegg items so a template's Maloppsett
   * entry can link them via `GtProjectExtensions` (Utvidelser).
   */
  private static async _addProjectExtensions(
    zip: any,
    manifest: IPackageManifest
  ): Promise<Array<{ extensionId: string; itemId: number; name: string }>> {
    const extensions = manifest.provisioning?.extensions ?? []
    if (extensions.length === 0) {
      throw new Error('Package contains no project extensions')
    }
    const web = SPDataAdapter.portalDataService.web
    const rootFolder = await web.lists
      .getByTitle(resource.Lists_ProjectExtensions_Title)
      .rootFolder.select('ServerRelativeUrl')()
    const folderUrl = rootFolder.ServerRelativeUrl

    const added: Array<{ extensionId: string; itemId: number; name: string }> = []
    for (const ext of extensions) {
      const zipFile = zip.file(ext.file)
      if (!zipFile) throw new Error(`Extension file ${ext.file} not found in package`)
      const content = await zipFile.async('string')
      // Stamp the source package id/version into the file so the catalog can
      // later detect that an installed extension is outdated (version-in-file).
      const stamped = PackageInstaller._stampExtension(content, manifest, ext.id)
      const fileName = ext.file.split('/').pop() as string
      const addResult = await web
        .getFolderByServerRelativePath(folderUrl)
        .files.addUsingPath(fileName, stamped, { Overwrite: true })
      const item = await addResult.file.getItem<{ Id: number }>('Id')
      await item.update({
        Title: ext.name,
        GtDescription: ext.description ?? manifest.description ?? '',
        GtExtensionDefault: !!ext.defaultSelected
      })
      added.push({ extensionId: ext.id, itemId: item.Id, name: ext.name })
    }
    return added
  }

  /**
   * Create/refresh the package's List Content (Listeinnhold) configs on the hub
   * and return their item ids. Each config is upserted by `Title` (re-import
   * updates the existing item instead of duplicating it). These items tell the
   * setup wizard to copy rows from a hub `GtLccSourceList` into a project's
   * `GtLccDestinationList`; the source list must already exist on the hub (it is
   * provisioned by the hub template before this runs). The returned ids are
   * linked to the Maloppsett item via `ListContentConfigLookup`.
   */
  private static async _addListContentConfigs(
    manifest: IPackageManifest
  ): Promise<Array<{ title: string; itemId: number }>> {
    const configs = manifest.provisioning?.listContent ?? []
    if (configs.length === 0) return []
    const web = SPDataAdapter.portalDataService.web
    const list = web.lists.getByTitle(resource.Lists_ListContent_Title)

    const result: Array<{ title: string; itemId: number }> = []
    for (const cfg of configs) {
      const properties = {
        Title: cfg.title,
        GtDescription: cfg.description ?? manifest.description ?? '',
        GtLccSourceList: cfg.sourceList,
        GtLccDestinationList: cfg.destinationList ?? cfg.sourceList,
        GtLccFields: cfg.fields ?? '-',
        GtLccDefault: !!cfg.default,
        GtLccHidden: !!cfg.hidden,
        GtLccLocked: !!cfg.locked
      }
      const existing = await list.items
        .filter(`Title eq '${PackageInstaller._escapeOData(cfg.title)}'`)
        .select('Id')
        .top(1)<Array<{ Id: number }>>()
      let itemId: number
      if (existing[0]) {
        itemId = existing[0].Id
        await list.items.getById(itemId).update(properties)
      } else {
        const addResult = await list.items.add(properties)
        itemId = addResult.data.Id
      }
      result.push({ title: cfg.title, itemId })
    }
    return result
  }

  private static _escapeOData(value: string): string {
    return value.replace(/'/g, "''")
  }

  /**
   * Embed a `PpPackage` stamp ({ id, version, extensionId }) at the root of the
   * extension JSON. The sp-js-provisioning handlers ignore unknown keys, so it
   * is inert at provisioning time but lets the catalog read the installed
   * version back from the Prosjekttillegg library. Falls back to the raw content
   * if the file isn't valid JSON.
   */
  private static _stampExtension(
    content: string,
    manifest: IPackageManifest,
    extensionId: string
  ): string {
    try {
      const json = JSON.parse(content)
      json.PpPackage = { id: manifest.id, version: manifest.version, extensionId }
      return JSON.stringify(json, null, 2)
    } catch {
      return content
    }
  }

  private static async _ensureFolder(web: any, parentUrl: string, name: string): Promise<void> {
    try {
      await web.getFolderByServerRelativePath(parentUrl).folders.addUsingPath(name)
    } catch {
      // Folder already exists.
    }
  }
}
