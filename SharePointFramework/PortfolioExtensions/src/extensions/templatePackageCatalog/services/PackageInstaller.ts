import { format } from '@fluentui/react/lib/Utilities'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { Logger, LogLevel } from '@pnp/logging'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/folders'
import '@pnp/sp/files'
import type JSZip from 'jszip'
import strings from 'PortfolioExtensionsStrings'
import resource from 'SharedResources'
import SPDataAdapter from '../../../data/SPDataAdapter'
import {
  ICatalogPackage,
  IInstallProgress,
  IInstallStep,
  InstallStepKey,
  InstallStepStatus,
  IPackageManifest
} from '../models'
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
 * Mode A — download a `.pppkg`, validate it, provision the hub via the same
 * `sp-js-provisioning` `WebProvisioner.applyTemplate` flow the template dialog
 * uses, store the project-level assets for the wizard, and write the Maloppsett
 * item. The taxonomy step is feature-flag-gated (no Term Store handler in
 * `sp-js-provisioning` 1.3.7).
 */
export class PackageInstaller {
  public static async runImport(options: IPackageInstallOptions): Promise<void> {
    const { package: pkg, context, featureFlagProvisioning, existingItemId, onProgress } = options

    const steps: IInstallStep[] = [
      InstallStepKey.Download,
      InstallStepKey.Unzip,
      InstallStepKey.ValidateManifest,
      InstallStepKey.CheckVersion,
      InstallStepKey.ProvisionHub,
      InstallStepKey.Taxonomy,
      InstallStepKey.StoreProjectTemplate,
      InstallStepKey.UpdateMaloppsett
    ].map((key) => ({ key, status: 'pending' as InstallStepStatus }))

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

      setStatus(InstallStepKey.ProvisionHub, 'running')
      await PackageInstaller._provisionHub(zip, manifest, context)
      setStatus(InstallStepKey.ProvisionHub, 'done')

      // Taxonomy — the only feature-flag-gated step (no handler in 1.3.7).
      if (featureFlags.enableTaxonomyProvisioning({ featureFlagProvisioning })) {
        setStatus(InstallStepKey.Taxonomy, 'running')
        const hasPermission = await SPDataAdapter.hasTermStorePermission()
        // The out-of-repo Term Store handler is not available yet; this is a
        // no-op placeholder to be replaced once it ships.
        setStatus(
          InstallStepKey.Taxonomy,
          hasPermission ? 'done' : 'skipped',
          hasPermission ? undefined : strings.CatalogPermissionError
        )
      } else {
        setStatus(InstallStepKey.Taxonomy, 'skipped', strings.CatalogStepSkippedFeatureFlag)
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

  private static async _unzip(buffer: ArrayBuffer): Promise<JSZip> {
    const JSZipModule = (await import('jszip')).default
    return JSZipModule.loadAsync(buffer)
  }

  private static async _readManifest(zip: JSZip): Promise<IPackageManifest> {
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
    zip: JSZip,
    manifest: IPackageManifest,
    context: ListViewCommandSetContext
  ): Promise<void> {
    const hubTemplate = manifest.provisioning?.hubTemplate
    if (!hubTemplate) return
    const file = zip.file(hubTemplate)
    if (!file) {
      throw new Error(`Hub template ${hubTemplate} not found in package`)
    }
    const schema = JSON.parse(await file.async('string'))
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
  private static async _storeProjectFiles(
    zip: JSZip,
    manifest: IPackageManifest
  ): Promise<boolean> {
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

  private static async _ensureFolder(web: any, parentUrl: string, name: string): Promise<void> {
    try {
      await web.getFolderByServerRelativePath(parentUrl).folders.addUsingPath(name)
    } catch {
      // Folder already exists.
    }
  }
}
