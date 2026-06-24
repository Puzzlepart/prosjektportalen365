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
 *   item. The taxonomy step runs by default (sp-js-provisioning 1.3.12 ships a
 *   Term Store handler) and can be disabled per environment — see
 *   {@link featureFlags.enableTaxonomyProvisioning}.
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
    ).map((key) => ({ key, status: 'pending' as InstallStepStatus, entries: [] }))

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
    // Append a granular line to a step's advanced log (what was applied / skipped / failed).
    const addLog = (
      key: InstallStepKey,
      message: string,
      level: 'info' | 'warning' | 'error' = 'info'
    ) => {
      steps.find((s) => s.key === key)?.entries.push({ message, level })
      emit()
    }

    emit()
    try {
      setStatus(InstallStepKey.Download, 'running')
      const buffer = await PackageInstaller._download(pkg.downloadUrl)
      setStatus(InstallStepKey.Download, 'done')
      addLog(InstallStepKey.Download, strings.CatalogLogDownloaded)

      setStatus(InstallStepKey.Unzip, 'running')
      const zip = await PackageInstaller._unzip(buffer)
      setStatus(InstallStepKey.Unzip, 'done')

      setStatus(InstallStepKey.ValidateManifest, 'running')
      const baseManifest = await PackageInstaller._readManifest(zip)
      // Bilingual packages ship per-locale provisioning variants; pick the one
      // matching the hub language so the right hub template, list content and
      // Maloppsett name/description are used (falls back to the base/nb-NO).
      const locale = PackageInstaller._detectLocale(context)
      const { manifest, localizedName, localizedDescription } = PackageInstaller._applyLocale(
        baseManifest,
        locale
      )
      setStatus(InstallStepKey.ValidateManifest, 'done')
      addLog(
        InstallStepKey.ValidateManifest,
        format(strings.CatalogLogManifestValidated, manifest.name, manifest.version)
      )

      setStatus(InstallStepKey.CheckVersion, 'running')
      const versionDetail = await PackageInstaller._checkVersion(manifest)
      setStatus(InstallStepKey.CheckVersion, 'done', versionDetail)

      if (isExtension) {
        // Extensions are added to the hub Prosjekttillegg library only. Nothing
        // is written to Maloppsett — linking to a template is a later, manual
        // admin choice.
        setStatus(InstallStepKey.Extensions, 'running')
        const added = await PackageInstaller._addProjectExtensions(zip, manifest)
        added.forEach((e) =>
          addLog(InstallStepKey.Extensions, format(strings.CatalogLogExtensionAdded, e.name))
        )
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
        addLog(InstallStepKey.CheckCompatibility, detail, 'warning')
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

      // A package that ships taxonomy is provisioned over JSOM by the Taxonomy
      // handler (which runs first in `applyTemplate` below). Pre-gate only on
      // Term Store *reachability* here — true write capability can't be probed
      // up front (the REST term-store write API is blocked on OAuth-only
      // tenants; see SPDataAdapter.hasTermStorePermission). A genuine permission
      // failure therefore surfaces fast from the provisioning step itself,
      // before any other hub objects are created. Packages without taxonomy
      // don't need the check.
      const packageHasTaxonomy =
        enableTaxonomy && (await PackageInstaller._hasTaxonomy(zip, manifest))
      const termStoreReachable = packageHasTaxonomy
        ? await SPDataAdapter.hasTermStorePermission()
        : false
      if (packageHasTaxonomy && !termStoreReachable) {
        setStatus(InstallStepKey.ProvisionHub, 'error', strings.CatalogTaxonomyPermissionBlocked)
        progress.status = 'error'
        progress.error = strings.CatalogTaxonomyPermissionBlocked
        progress.currentStep = undefined
        emit()
        return false
      }

      setStatus(InstallStepKey.ProvisionHub, 'running')
      await PackageInstaller._provisionHub(zip, manifest, context, enableTaxonomy, report)
      setStatus(InstallStepKey.ProvisionHub, 'done')
      addLog(InstallStepKey.ProvisionHub, strings.CatalogLogHubProvisioned)

      // An enabled-but-no-taxonomy package makes the Taxonomy step a no-op
      // success; a genuine term-store write failure is reported by ProvisionHub.
      setStatus(
        InstallStepKey.Taxonomy,
        enableTaxonomy ? 'done' : 'skipped',
        enableTaxonomy ? undefined : strings.CatalogStepSkippedFeatureFlag
      )
      if (packageHasTaxonomy) addLog(InstallStepKey.Taxonomy, strings.CatalogLogTaxonomyApplied)
      else if (!enableTaxonomy)
        addLog(InstallStepKey.Taxonomy, strings.CatalogStepSkippedFeatureFlag)

      // Add the template's bundled project extensions to the Prosjekttillegg
      // library (if any), so they can be linked from the Maloppsett item below.
      let extensionItems: Array<{ extensionId: string; itemId: number; name: string }> = []
      setStatus(InstallStepKey.Extensions, 'running')
      if ((manifest.provisioning?.extensions?.length ?? 0) > 0) {
        extensionItems = await PackageInstaller._addProjectExtensions(zip, manifest)
        extensionItems.forEach((e) =>
          addLog(InstallStepKey.Extensions, format(strings.CatalogLogExtensionAdded, e.name))
        )
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
        listContentItems.forEach((l) =>
          addLog(InstallStepKey.ListContent, format(strings.CatalogLogListContentAdded, l.title))
        )
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
      if (stored) addLog(InstallStepKey.StoreProjectTemplate, strings.CatalogLogStored)

      setStatus(InstallStepKey.UpdateTemplateOptions, 'running')
      await TemplateOptionsService.upsertImported(pkg, existingItemId, {
        projectContentTypeId: manifest.provisioning?.projectContentTypeId,
        projectPhaseTermSetId: manifest.provisioning?.projectPhaseTermSetId,
        extensionItemIds: extensionItems.map((e) => e.itemId),
        listContentItemIds: listContentItems.map((l) => l.itemId),
        icon: manifest.icon,
        name: localizedName,
        description: localizedDescription
      })
      setStatus(InstallStepKey.UpdateTemplateOptions, 'done')
      addLog(InstallStepKey.UpdateTemplateOptions, strings.CatalogLogTemplateOptionsUpdated)

      progress.status = 'success'
      progress.currentStep = undefined
      emit()
      return true
    } catch (error) {
      const running = steps.find((s) => s.status === 'running')
      if (running) {
        running.status = 'error'
        running.detail = error?.message
        running.entries.push({
          message: error?.message ?? strings.CatalogInstallErrorTitle,
          level: 'error'
        })
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
      throw new Error(
        format(strings.CatalogDownloadError, `${response.status} ${response.statusText}`)
      )
    }
    return response.arrayBuffer()
  }

  private static async _unzip(buffer: ArrayBuffer): Promise<any> {
    const JSZipModule = (await import('jszip')).default
    return JSZipModule.loadAsync(buffer)
  }

  private static async _readManifest(zip: any): Promise<IPackageManifest> {
    const file = zip.file('manifest.json')
    if (!file) throw new Error(strings.CatalogManifestMissing)
    let manifest: IPackageManifest
    try {
      manifest = JSON.parse(await file.async('string'))
    } catch {
      throw new Error(strings.CatalogManifestInvalidJson)
    }
    if (!manifest.id || !manifest.version || !manifest.type) {
      throw new Error(strings.CatalogManifestMissingFields)
    }
    return manifest
  }

  /**
   * Detect the hub's language as a BCP-47 locale (matching the keys of
   * `manifest.provisioning.localized`). Uses the site LCID (1044 → `nb-NO`,
   * 1033 → `en-US`), falling back to the UI culture, then `nb-NO`.
   */
  private static _detectLocale(context: ListViewCommandSetContext): string {
    const lcid = context?.pageContext?.web?.language
    if (lcid === 1033) return 'en-US'
    if (lcid === 1044) return 'nb-NO'
    const ui =
      context?.pageContext?.cultureInfo?.currentUICultureName ||
      context?.pageContext?.cultureInfo?.currentCultureName ||
      ''
    return /^en/i.test(ui) ? 'en-US' : 'nb-NO'
  }

  /**
   * Resolve the effective manifest for a locale. When
   * `provisioning.localized[locale]` exists, its `hubTemplate`/`template`/
   * `listContent` override the base provisioning and its `name`/`description`
   * are returned for the Maloppsett item. Without a match the base manifest is
   * returned unchanged (so single-language packages are unaffected).
   */
  private static _applyLocale(
    manifest: IPackageManifest,
    locale: string
  ): {
    manifest: IPackageManifest
    localizedName?: string
    localizedDescription?: string
  } {
    const loc = manifest.provisioning?.localized?.[locale]
    if (!loc) return { manifest }
    const provisioning = {
      ...manifest.provisioning,
      ...(loc.hubTemplate ? { hubTemplate: loc.hubTemplate } : {}),
      ...(loc.template ? { template: loc.template } : {}),
      ...(loc.listContent ? { listContent: loc.listContent } : {})
    }
    return {
      manifest: { ...manifest, provisioning },
      localizedName: loc.name,
      localizedDescription: loc.description
    }
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

  /**
   * Whether the package's hub template declares taxonomy content (a term group
   * and/or term sets). Used to pre-gate the import on term-store permission.
   *
   * @param zip - The opened package archive
   * @param manifest - The package manifest
   */
  private static async _hasTaxonomy(zip: any, manifest: IPackageManifest): Promise<boolean> {
    const hubTemplate = manifest.provisioning?.hubTemplate
    if (!hubTemplate) return false
    const file = zip.file(hubTemplate)
    if (!file) return false
    try {
      const schema = JSON.parse(await file.async('string'))
      const taxonomy = schema?.Taxonomy
      return !!(taxonomy && ((taxonomy.TermSets?.length ?? 0) > 0 || taxonomy.TermGroup))
    } catch {
      return false
    }
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
      throw new Error(format(strings.CatalogHubTemplateMissing, hubTemplate))
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
   * Provision a cloud template's **essential hub dependencies** when it is published as a
   * cloud template ("Tilgjengeliggjør som skymal", admin context).
   *
   * A cloud template's content types must exist on the hub and be bound to the Prosjekter
   * / Prosjektstatus lists so the portfolio recognizes projects created from it.
   * This applies only that structural subset of the package's `hub-template.json`
   * to the hub: `SiteFields` + `ContentTypes` + the content-type **bindings** to
   * existing hub lists. List-content lists (entries carrying `DataRows`) are
   * project content pulled from the `.pppkg` at setup time, not hub objects, so
   * they are dropped. Returns the number of content types provisioned.
   */
  public static async provisionCloudTemplateHubDependencies(
    pkg: ICatalogPackage,
    context: ListViewCommandSetContext
  ): Promise<void> {
    const buffer = await PackageInstaller._download(pkg.downloadUrl)
    const zip = await PackageInstaller._unzip(buffer)
    const manifest = await PackageInstaller._readManifest(zip)
    const hubTemplate = manifest.provisioning?.hubTemplate
    if (!hubTemplate) return
    const file = zip.file(hubTemplate)
    if (!file) return
    const schema = JSON.parse(await file.async('string'))

    const filtered: Record<string, any> = {}
    if (schema.SiteFields?.length) filtered.SiteFields = schema.SiteFields
    if (schema.ContentTypes?.length) filtered.ContentTypes = schema.ContentTypes
    // Keep only the content-type **binding** entries (the Prosjekter /
    // Prosjektstatus / Prosjektdata bindings). Drop list-content sources
    // (`DataRows`) and standalone project lists/document libraries (no bindings) —
    // those are project content pulled from the .pppkg at setup time, not hub
    // objects, and must not be created on the hub.
    const bindingLists = (schema.Lists ?? []).filter(
      (list: any) =>
        Array.isArray(list.ContentTypeBindings) &&
        list.ContentTypeBindings.length > 0 &&
        !list.DataRows
    )
    if (bindingLists.length) filtered.Lists = bindingLists

    if (!filtered.ContentTypes && !filtered.SiteFields) return

    const { WebProvisioner } = await import('sp-js-provisioning')
    const provisioner = new WebProvisioner(SPDataAdapter.portalDataService.web).setup({
      spfxContext: context,
      logging: { prefix: '(TemplatePackageCatalog) (Cloud)', activeLogLevel: LogLevel.Info }
    } as any)
    await provisioner.applyTemplate(filtered, null, (handler) => {
      Logger.log({
        message: `(PackageInstaller) provisionCloudTemplateHubDependencies: applying handler ${handler}`,
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
        // These entries are provisioning JSON (template/extension/content), so
        // decoding as text is safe. Binary assets are not expected here and
        // would be corrupted by the string read.
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
      throw new Error(strings.CatalogNoProjectExtensions)
    }
    const web = SPDataAdapter.portalDataService.web
    const rootFolder = await web.lists
      .getByTitle(resource.Lists_ProjectExtensions_Title)
      .rootFolder.select('ServerRelativeUrl')()
    const folderUrl = rootFolder.ServerRelativeUrl

    const added: Array<{ extensionId: string; itemId: number; name: string }> = []
    for (const ext of extensions) {
      const zipFile = zip.file(ext.file)
      if (!zipFile) throw new Error(format(strings.CatalogExtensionFileMissing, ext.file))
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

  /**
   * Mirrors sp-js-provisioning's own (private, non-exported) OData escaping:
   * single quotes are doubled. `Title` is package-controlled, so this is
   * defense-in-depth rather than untrusted-input handling.
   */
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
