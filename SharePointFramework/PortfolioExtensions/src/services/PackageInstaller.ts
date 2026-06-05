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
  IInstallProgress,
  IInstallStep,
  InstallStepKey,
  InstallStepStatus,
  IPackageManifest
} from 'models'
import { featureFlags } from './featureFlags'
import { MaloppsettService } from './MaloppsettService'
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
  public static async runImport(options: IPackageInstallOptions): Promise<void> {
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
            InstallStepKey.ProvisionHub,
            InstallStepKey.Taxonomy,
            InstallStepKey.StoreProjectTemplate,
            InstallStepKey.UpdateMaloppsett
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
          format(strings.CatalogStepExtensionsDetail, added)
        )
        progress.status = 'success'
        progress.currentStep = undefined
        emit()
        return
      }

      // Taxonomy is the only feature-flag-gated part. When enabled, the hub
      // schema's `Taxonomy` part is provisioned by the sp-js-provisioning
      // Taxonomy handler as part of `applyTemplate` below; when disabled, it is
      // stripped from the schema so the handler skips it.
      const enableTaxonomy = featureFlags.enableTaxonomyProvisioning({
        featureFlagProvisioning
      })

      setStatus(InstallStepKey.ProvisionHub, 'running')
      await PackageInstaller._provisionHub(zip, manifest, context, enableTaxonomy)
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

      setStatus(InstallStepKey.StoreProjectTemplate, 'running')
      const stored = await PackageInstaller._storeProjectFiles(zip, manifest)
      setStatus(InstallStepKey.StoreProjectTemplate, stored ? 'done' : 'skipped')

      setStatus(InstallStepKey.UpdateMaloppsett, 'running')
      await MaloppsettService.upsertImported(pkg, existingItemId)
      setStatus(InstallStepKey.UpdateMaloppsett, 'done')

      progress.status = 'success'
      progress.currentStep = undefined
      emit()
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
    includeTaxonomy: boolean
  ): Promise<void> {
    const hubTemplate = manifest.provisioning?.hubTemplate
    if (!hubTemplate) return
    const file = zip.file(hubTemplate)
    if (!file) {
      throw new Error(`Hub template ${hubTemplate} not found in package`)
    }
    const schema = JSON.parse(await file.async('string'))
    // Gate the (sp-js-provisioning) Taxonomy handler: strip the Taxonomy part
    // when the feature flag is off so term-store provisioning is skipped.
    if (!includeTaxonomy && schema.Taxonomy) {
      delete schema.Taxonomy
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
   * Returns the number of extensions added.
   */
  private static async _addProjectExtensions(
    zip: any,
    manifest: IPackageManifest
  ): Promise<number> {
    const extensions = manifest.provisioning?.extensions ?? []
    if (extensions.length === 0) {
      throw new Error('Package contains no project extensions')
    }
    const web = SPDataAdapter.portalDataService.web
    const rootFolder = await web.lists
      .getByTitle(resource.Lists_ProjectExtensions_Title)
      .rootFolder.select('ServerRelativeUrl')()
    const folderUrl = rootFolder.ServerRelativeUrl

    let added = 0
    for (const ext of extensions) {
      const zipFile = zip.file(ext.file)
      if (!zipFile) throw new Error(`Extension file ${ext.file} not found in package`)
      const content = await zipFile.async('string')
      const fileName = ext.file.split('/').pop() as string
      const addResult = await web
        .getFolderByServerRelativePath(folderUrl)
        .files.addUsingPath(fileName, content, { Overwrite: true })
      const item = await addResult.file.getItem()
      await item.update({
        Title: ext.name,
        GtDescription: ext.description ?? manifest.description ?? '',
        GtExtensionDefault: !!ext.defaultSelected
      })
      added++
    }
    return added
  }

  private static async _ensureFolder(web: any, parentUrl: string, name: string): Promise<void> {
    try {
      await web.getFolderByServerRelativePath(parentUrl).folders.addUsingPath(name)
    } catch {
      // Folder already exists.
    }
  }
}
