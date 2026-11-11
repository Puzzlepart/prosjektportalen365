// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The services and the data adapter reach the hub; they are
// stand-ins, and the feature flags are the real ones.
const services = {
  CatalogService: { getCatalog: jest.fn(), revalidateCatalog: jest.fn() },
  TemplateOptionsService: {
    getItems: jest.fn(),
    buildCrossReference: jest.fn(),
    remove: jest.fn(),
    createCentral: jest.fn(),
    updateCentral: jest.fn()
  },
  ProjectExtensionsService: { getCrossReference: jest.fn(), remove: jest.fn() },
  TelemetryService: { track: jest.fn() },
  PackageInstaller: { runImport: jest.fn(), provisionCloudTemplateHubDependencies: jest.fn() }
}
jest.mock('services', () => ({
  ...services,
  featureFlags: jest.requireActual('services/featureFlags').featureFlags
}))
const mockAdapter = { getInstalledPPVersion: jest.fn() }
jest.mock('data/SPDataAdapter', () => ({ __esModule: true, default: mockAdapter }))

import { act, renderHook, waitFor } from '@testing-library/react'
import strings from 'PortfolioExtensionsStrings'
import { format } from 'pp365-shared-library'
import { ALL_FILTER } from './types'
import { useTemplatePackageCatalog } from './useTemplatePackageCatalog'

/**
 * The template package catalog's logic: loading the catalog with what the hub has installed,
 * finding a package, copying one to the installation, publishing and updating a cloud template,
 * and removing a package, each told as it went and tracked as what it was.
 */
const CATALOG_URL = 'https://katalog.example/catalog.json'
const TEMPLATE = {
  id: 'Byggprosjekt',
  name: 'Byggprosjekt',
  version: '2.0.0',
  type: 'template',
  tags: ['Bygg'],
  publishedDate: '2026-01-15'
}
const CLOUD_TEMPLATE = {
  id: 'Forskningsprosjekt',
  name: 'Forskningsprosjekt',
  description: 'Anlégg og leverandørsamhandling',
  version: '1.0.2',
  type: 'template',
  tags: ['Forskning'],
  languages: ['nb-NO', 'en-US'],
  publishedDate: '2026-03-01',
  minPPVersion: '1.16.0'
}
const EXTENSION = {
  id: 'Risikotillegg',
  name: 'Risikotillegg',
  version: '1.0.0',
  type: 'extension',
  languages: ['en-US', 'sv-SE', 'de-DE'],
  publishedDate: '2026-01-15'
}
const HIDDEN = { id: 'Skjult', name: 'Skjult', version: '0.1.0', type: 'template', hidden: true }
const CATALOG = { packages: [CLOUD_TEMPLATE, TEMPLATE, EXTENSION, HIDDEN] }

/**
 * What the lists hold: the template copied at its version, the cloud template registered a
 * version behind, and the extension added.
 */
const TEMPLATE_REFS = {
  byggprosjekt: { itemId: 7, installedVersion: '2.0.0', packageType: 'Importert' },
  forskningsprosjekt: {
    itemId: 24,
    installedVersion: '1.0.1',
    packageType: 'Sentral',
    updateAvailable: true
  }
}
const EXTENSION_REFS = {
  risikotillegg: { itemId: 3, installedVersion: '1.0.0', packageType: 'Importert' }
}

const REPORT = { conflicts: [{ targetName: 'Fase' }], hasConflicts: true }

/** What provisioning a cloud template's hub dependencies answers, and what its item takes. */
const HUB_DEPENDENCIES = {
  completed: true,
  taxonomySkipped: false,
  manifest: {
    provisioning: { projectContentTypeId: '0x0100AB', projectPhaseTermSetId: 'fase-termsett' }
  },
  localizedName: 'Forskningsprosjekt',
  errors: [] as string[]
}
const CENTRAL_OPTIONS = {
  projectContentTypeId: '0x0100AB',
  projectPhaseTermSetId: 'fase-termsett',
  name: 'Forskningsprosjekt'
}

/** The hub's answers as the catalog loads: the catalog, the lists' installs and the version. */
function answerHub(): void {
  services.CatalogService.getCatalog.mockResolvedValue({
    catalog: CATALOG,
    degraded: false,
    fromCache: false
  })
  services.TemplateOptionsService.getItems.mockResolvedValue([])
  services.TemplateOptionsService.buildCrossReference.mockImplementation(
    () => new Map(Object.entries(TEMPLATE_REFS))
  )
  services.ProjectExtensionsService.getCrossReference.mockImplementation(() =>
    Promise.resolve(new Map(Object.entries(EXTENSION_REFS)))
  )
  mockAdapter.getInstalledPPVersion.mockResolvedValue('1.15.0')
}

/** The catalog's hook rendered and loaded, `setUp` changing the hub's answers first. */
async function renderCatalog(setUp?: () => void) {
  answerHub()
  setUp?.()
  const props = { catalogUrl: CATALOG_URL, onDismiss: jest.fn() } as any
  const { result } = renderHook(() => useTemplatePackageCatalog(props))
  await waitFor(() => expect(result.current.state.loading).toBe(false))
  return result
}

/** The events an action was tracked with. */
const tracked = (action: string) =>
  services.TelemetryService.track.mock.calls
    .filter(([, event]) => event.action === action)
    .map(([, event]) => event)

/** The statuses the removals were tracked with. */
const trackedStatuses = () => tracked('remove').map((event) => event.status)

beforeEach(() => jest.clearAllMocks())

describe('useTemplatePackageCatalog, loading the catalog', () => {
  it("loads the catalog with both lists' installs and the installed version, and chooses the first template", async () => {
    const result = await renderCatalog()
    expect(result.current.state.catalog).toEqual(CATALOG)
    expect(result.current.state.installedVersion).toBe('1.15.0')
    expect(result.current.crossRefFor('Forskningsprosjekt')).toMatchObject({ itemId: 24 })
    expect(result.current.crossRefFor('Risikotillegg')).toMatchObject({ itemId: 3 })
    // The templates by name, the hidden package left out.
    expect(result.current.filteredPackages.map((pkg) => pkg.id)).toEqual([
      'Byggprosjekt',
      'Forskningsprosjekt'
    ])
    await waitFor(() => expect(result.current.selectedPackage).toEqual(TEMPLATE))
    expect(result.current.state.detailOpen).toBe(false)
    expect(result.current.categories).toEqual(['Bygg', 'Forskning'])
    // Norwegian and English first, the other languages by name.
    expect(result.current.languages).toEqual(['nb', 'en', 'de-de', 'sv-se'])
  })

  it('keeps the catalog when the lists or the installed version cannot be read', async () => {
    const result = await renderCatalog(() => {
      services.TemplateOptionsService.getItems.mockRejectedValue(new Error('Maloppsett mangler'))
      services.ProjectExtensionsService.getCrossReference.mockRejectedValue(new Error(''))
      mockAdapter.getInstalledPPVersion.mockRejectedValue(new Error('Ingen installasjonslogg'))
    })
    expect(result.current.state.catalog).toEqual(CATALOG)
    expect(result.current.state.crossRef.size).toBe(0)
    expect(result.current.state.installedVersion).toBeUndefined()
    // A package for a newer Prosjektportalen is allowed while the installed version is unknown.
    expect(result.current.isSupported(CLOUD_TEMPLATE as any)).toBe(true)
  })

  it('shows a cached catalog at once and swaps in the fresh one', async () => {
    const fresh = { packages: [TEMPLATE] }
    const result = await renderCatalog(() => {
      services.CatalogService.getCatalog.mockResolvedValue({
        catalog: CATALOG,
        degraded: true,
        error: 'Frakoblet',
        fromCache: true
      })
      services.CatalogService.revalidateCatalog.mockResolvedValue(fresh)
      mockAdapter.getInstalledPPVersion.mockResolvedValue(null)
    })
    await waitFor(() => expect(result.current.state.catalog).toBe(fresh))
    expect(result.current.state).toMatchObject({ degraded: false, error: undefined })
    expect(result.current.state.installedVersion).toBeUndefined()
    expect(services.CatalogService.revalidateCatalog).toHaveBeenCalledWith(CATALOG_URL)
  })

  it('loads the catalog again on retry, and keeps a cached one that cannot be refreshed', async () => {
    const result = await renderCatalog(() => {
      services.CatalogService.getCatalog.mockResolvedValue({
        catalog: CATALOG,
        degraded: true,
        error: 'Frakoblet',
        fromCache: true
      })
      services.CatalogService.revalidateCatalog.mockResolvedValue(undefined)
    })
    await waitFor(() => expect(services.CatalogService.revalidateCatalog).toHaveBeenCalled())
    expect(result.current.state).toMatchObject({ catalog: CATALOG, degraded: true })
    services.CatalogService.getCatalog.mockResolvedValue({
      catalog: CATALOG,
      degraded: false,
      fromCache: false
    })
    act(() => result.current.reloadCatalog())
    expect(result.current.state).toMatchObject({ loading: true, degraded: false })
    await waitFor(() => expect(result.current.state.loading).toBe(false))
    expect(services.CatalogService.getCatalog).toHaveBeenCalledTimes(2)
  })

  it('drops what arrives after the catalog was closed', async () => {
    answerHub()
    let answer: (value: unknown) => void
    services.CatalogService.getCatalog.mockReturnValue(new Promise((resolve) => (answer = resolve)))
    const props = { catalogUrl: CATALOG_URL, onDismiss: jest.fn() } as any
    const { result, unmount } = renderHook(() => useTemplatePackageCatalog(props))
    unmount()
    answer({ catalog: CATALOG, degraded: false, fromCache: false })
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
    expect(result.current.state.loading).toBe(true)
    expect(result.current.state.catalog).toBeUndefined()
  })
})

describe('useTemplatePackageCatalog, finding a package', () => {
  it('searches names, descriptions and tags regardless of accents, case, ø and æ', async () => {
    const result = await renderCatalog()
    const found = (search: string) => {
      act(() => result.current.setFilter('search', search))
      return result.current.filteredPackages.map((pkg) => pkg.id)
    }
    expect(found('anlegg')).toEqual(['Forskningsprosjekt'])
    expect(found('LEVERANDOR')).toEqual(['Forskningsprosjekt'])
    expect(found('leverandør')).toEqual(['Forskningsprosjekt'])
    expect(found('bygg')).toEqual(['Byggprosjekt'])
    expect(found('ingenting')).toEqual([])
    expect(result.current.activeFilterCount).toBe(1)
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('filters by type, category, state, language and compatibility, sorts, and clears the filters', async () => {
    const result = await renderCatalog()
    const ids = () => result.current.filteredPackages.map((pkg) => pkg.id)
    act(() => result.current.setFilter('type', ALL_FILTER))
    expect(ids()).toEqual(['Byggprosjekt', 'Forskningsprosjekt', 'Risikotillegg'])
    // Newest first, and by name on the same day.
    act(() => result.current.setSort('newest'))
    expect(ids()).toEqual(['Forskningsprosjekt', 'Byggprosjekt', 'Risikotillegg'])
    act(() => result.current.setFilter('type', 'extension'))
    expect(ids()).toEqual(['Risikotillegg'])
    act(() => result.current.setFilter('type', ALL_FILTER))
    // Any of the chosen categories.
    act(() => result.current.setCategories(['Forskning', 'Bygg']))
    expect(ids()).toEqual(['Forskningsprosjekt', 'Byggprosjekt'])
    act(() => result.current.setCategories([]))
    act(() => result.current.setFilter('status', 'Sentral'))
    expect(ids()).toEqual(['Forskningsprosjekt'])
    act(() => result.current.setFilter('status', 'update'))
    expect(ids()).toEqual(['Forskningsprosjekt'])
    act(() => result.current.setFilter('status', 'Importert'))
    expect(ids()).toEqual(['Byggprosjekt', 'Risikotillegg'])
    act(() => result.current.setFilter('status', 'all'))
    act(() => result.current.setFilter('language', 'en'))
    expect(ids()).toEqual(['Forskningsprosjekt', 'Risikotillegg'])
    // The cloud template needs Prosjektportalen 1.16.0; 1.15.0 is installed.
    act(() => result.current.setCompatibleOnly(true))
    expect(ids()).toEqual(['Risikotillegg'])
    expect(result.current.activeFilterCount).toBe(3)
    act(() => result.current.clearFilters())
    expect(ids()).toEqual(['Forskningsprosjekt', 'Byggprosjekt'])
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('switches the view, opens and closes a package, and closes the catalog', async () => {
    const result = await renderCatalog()
    act(() => result.current.setRenderMode('list'))
    expect(result.current.state.renderMode).toBe('list')
    act(() => result.current.setSelected('Risikotillegg'))
    expect(result.current.selectedPackage).toEqual(EXTENSION)
    expect(result.current.state.detailOpen).toBe(true)
    act(() => result.current.closeDetail())
    expect(result.current.state.detailOpen).toBe(false)
    act(() => result.current.close())
    expect(result.current.open).toBe(false)
    expect(result.current.props.onDismiss).toHaveBeenCalled()
  })
})

describe('useTemplatePackageCatalog, copying a package to the installation', () => {
  it('updates its own install in place, and tells and tracks the update', async () => {
    services.PackageInstaller.runImport.mockResolvedValue({ completed: true, errors: [] })
    const result = await renderCatalog()
    await act(() => result.current.importPackage(TEMPLATE as any))
    expect(services.PackageInstaller.runImport).toHaveBeenCalledWith(
      expect.objectContaining({ package: TEMPLATE, existingItemId: 7 })
    )
    expect(result.current.state.notification).toEqual({
      intent: 'success',
      text: strings.CatalogInstallSuccessText
    })
    expect(tracked('update')).toEqual([
      expect.objectContaining({ status: 'success', previousVersion: '2.0.0', ppVersion: '1.15.0' })
    ])
    // The lists are read again, so the package's state follows.
    expect(services.TemplateOptionsService.getItems).toHaveBeenCalledTimes(2)
  })

  it("copies a cloud template's package beside its registration, which stays a cloud template", async () => {
    // The import was given the cloud template's item, and wrote the local install over it.
    services.PackageInstaller.runImport.mockResolvedValue({ completed: true, errors: [] })
    const result = await renderCatalog()
    await act(() => result.current.importPackage(CLOUD_TEMPLATE as any))
    expect(services.PackageInstaller.runImport).toHaveBeenCalledTimes(1)
    expect(services.PackageInstaller.runImport.mock.calls[0][0].existingItemId).toBeUndefined()
    expect(tracked('update')).toEqual([])
    expect(tracked('install')).toHaveLength(1)
    expect(tracked('install')[0].previousVersion).toBeUndefined()
  })

  it("tells an import the engine logged errors in with a warning, and an extension's success", async () => {
    const result = await renderCatalog()
    services.PackageInstaller.runImport.mockResolvedValue({ completed: true, errors: ['Feltet'] })
    await act(() => result.current.importPackage(TEMPLATE as any))
    expect(result.current.state.notification).toEqual({
      intent: 'warning',
      text: format(strings.CatalogInstallWarningText, 1)
    })
    services.PackageInstaller.runImport.mockResolvedValue({ completed: true, errors: [] })
    await act(() => result.current.importPackage(EXTENSION as any))
    expect(result.current.state.notification).toEqual({
      intent: 'success',
      text: strings.CatalogInstallSuccessTextExtension
    })
  })

  it('shows its progress and waits at the compatibility prompt, telling nothing when cancelled', async () => {
    const progress = { steps: [] as any[], status: 'running', log: [] as any[] }
    services.PackageInstaller.runImport.mockImplementation(async (options: any) => {
      options.onProgress(progress)
      return { completed: await options.onConflicts(REPORT), errors: [] }
    })
    const result = await renderCatalog()
    let importing: Promise<void>
    act(() => {
      importing = result.current.importPackage(TEMPLATE as any)
    })
    expect(result.current.state.installProgress).toBe(progress)
    expect(result.current.state.compatibilityReport).toBe(REPORT)
    await act(async () => {
      result.current.resolveCompatibility(false)
      await importing
    })
    expect(result.current.state.compatibilityReport).toBeUndefined()
    expect(result.current.state.notification).toBeUndefined()
    expect(services.TelemetryService.track).not.toHaveBeenCalled()
  })

  it('tells and tracks an import that failed', async () => {
    const result = await renderCatalog()
    services.PackageInstaller.runImport.mockRejectedValue(new Error('Nedlastingen feilet'))
    await act(() => result.current.importPackage(TEMPLATE as any))
    expect(result.current.state.notification).toEqual({
      intent: 'error',
      text: 'Nedlastingen feilet'
    })
    expect(tracked('update')).toEqual([
      expect.objectContaining({ status: 'error', errorMessage: 'Nedlastingen feilet' })
    ])
    services.PackageInstaller.runImport.mockRejectedValue(new Error(''))
    await act(() => result.current.importPackage(TEMPLATE as any))
    expect(result.current.state.notification).toEqual({
      intent: 'error',
      text: strings.CatalogInstallErrorTitle
    })
  })
})

describe('useTemplatePackageCatalog, cloud templates', () => {
  it('publishes a package as a new cloud template, its hub dependencies provisioned first', async () => {
    services.PackageInstaller.provisionCloudTemplateHubDependencies.mockResolvedValue(
      HUB_DEPENDENCIES
    )
    const result = await renderCatalog()
    await act(() => result.current.publishCentral(TEMPLATE as any))
    expect(services.TemplateOptionsService.createCentral).toHaveBeenCalledWith(
      TEMPLATE,
      CENTRAL_OPTIONS
    )
    expect(services.TemplateOptionsService.updateCentral).not.toHaveBeenCalled()
    expect(result.current.state.notification).toEqual({
      intent: 'success',
      text: strings.CatalogPublishSuccessText
    })
    expect(result.current.state.busyAction).toBeUndefined()
    expect(tracked('publishCentral')).toEqual([
      expect.objectContaining({ status: 'success', detail: { taxonomySkipped: false } })
    ])
    expect(tracked('publishCentral')[0].previousVersion).toBeUndefined()
  })

  it("updates a cloud template's registration in place to the newer version, as a cloud template", async () => {
    // The update ran the import with the cloud template's item, which then held a local install.
    services.PackageInstaller.provisionCloudTemplateHubDependencies.mockResolvedValue(
      HUB_DEPENDENCIES
    )
    const result = await renderCatalog()
    await act(() => result.current.updateCentral(CLOUD_TEMPLATE as any))
    expect(services.PackageInstaller.provisionCloudTemplateHubDependencies).toHaveBeenCalledWith(
      CLOUD_TEMPLATE,
      undefined,
      expect.objectContaining({ onConflicts: expect.any(Function) })
    )
    expect(services.TemplateOptionsService.updateCentral).toHaveBeenCalledWith(
      24,
      CLOUD_TEMPLATE,
      CENTRAL_OPTIONS
    )
    expect(services.TemplateOptionsService.createCentral).not.toHaveBeenCalled()
    expect(services.PackageInstaller.runImport).not.toHaveBeenCalled()
    expect(result.current.state.notification).toEqual({
      intent: 'success',
      text: format(strings.CatalogUpdateCentralSuccessText, '1.0.2')
    })
    // The version updated from tells it from a first publish.
    expect(tracked('publishCentral')).toEqual([
      expect.objectContaining({
        status: 'success',
        packageVersion: '1.0.2',
        previousVersion: '1.0.1'
      })
    ])
  })

  it('never updates a local install as a cloud template', async () => {
    const result = await renderCatalog()
    await act(() => result.current.updateCentral(TEMPLATE as any))
    expect(services.PackageInstaller.provisionCloudTemplateHubDependencies).not.toHaveBeenCalled()
    expect(services.TemplateOptionsService.updateCentral).not.toHaveBeenCalled()
  })

  it('warns when the taxonomy was skipped, and lists the errors the hub provisioning logged', async () => {
    const result = await renderCatalog()
    services.PackageInstaller.provisionCloudTemplateHubDependencies.mockResolvedValue({
      ...HUB_DEPENDENCIES,
      taxonomySkipped: true
    })
    await act(() => result.current.updateCentral(CLOUD_TEMPLATE as any))
    expect(result.current.state.notification).toEqual({
      intent: 'warning',
      text: format(strings.CatalogUpdateCentralTaxonomySkippedText, '1.0.2')
    })
    services.PackageInstaller.provisionCloudTemplateHubDependencies.mockResolvedValue({
      ...HUB_DEPENDENCIES,
      errors: ['Innholdstypen']
    })
    await act(() => result.current.publishCentral(TEMPLATE as any))
    expect(result.current.state.notification).toEqual({
      intent: 'warning',
      text: format(strings.CatalogPublishErrorsText, strings.CatalogPublishSuccessText, 1),
      details: { label: strings.CatalogPublishErrorsLabel, lines: ['Innholdstypen'] }
    })
  })

  it('tells a publish or an update cancelled at the compatibility prompt, having written nothing', async () => {
    services.PackageInstaller.provisionCloudTemplateHubDependencies.mockImplementation(
      async (_pkg: any, _context: any, options: any) => ({
        ...HUB_DEPENDENCIES,
        completed: await options.onConflicts(REPORT)
      })
    )
    const result = await renderCatalog()
    let updating: Promise<void>
    act(() => {
      updating = result.current.updateCentral(CLOUD_TEMPLATE as any)
    })
    expect(result.current.state.compatibilityReport).toBe(REPORT)
    expect(result.current.state.busyAction).toBe('publish')
    await act(async () => {
      result.current.resolveCompatibility(false)
      await updating
    })
    expect(result.current.state.notification).toEqual({
      intent: 'warning',
      text: strings.CatalogUpdateCentralCancelledText
    })
    let publishing: Promise<void>
    act(() => {
      publishing = result.current.publishCentral(TEMPLATE as any)
    })
    await act(async () => {
      result.current.resolveCompatibility(false)
      await publishing
    })
    expect(result.current.state.notification).toEqual({
      intent: 'warning',
      text: strings.CatalogPublishCancelledText
    })
    expect(result.current.state.busyAction).toBeUndefined()
    expect(services.TemplateOptionsService.updateCentral).not.toHaveBeenCalled()
    expect(services.TemplateOptionsService.createCentral).not.toHaveBeenCalled()
    expect(services.TelemetryService.track).not.toHaveBeenCalled()
  })

  it('tells and tracks a publish or an update that failed', async () => {
    services.PackageInstaller.provisionCloudTemplateHubDependencies.mockRejectedValue(new Error(''))
    const result = await renderCatalog()
    await act(() => result.current.updateCentral(CLOUD_TEMPLATE as any))
    expect(result.current.state.notification).toEqual({
      intent: 'error',
      text: strings.CatalogUpdateCentralErrorText
    })
    services.PackageInstaller.provisionCloudTemplateHubDependencies.mockRejectedValue(
      new Error('Ingen tilgang til termlageret')
    )
    await act(() => result.current.publishCentral(TEMPLATE as any))
    expect(result.current.state.notification).toEqual({
      intent: 'error',
      text: 'Ingen tilgang til termlageret'
    })
    expect(tracked('publishCentral')).toEqual([
      expect.objectContaining({ status: 'error', previousVersion: '1.0.1' }),
      expect.objectContaining({ status: 'error', errorMessage: 'Ingen tilgang til termlageret' })
    ])
  })
})

describe('useTemplatePackageCatalog, removing a package', () => {
  it('tells and tracks a template the template options list refused to remove as a failure', async () => {
    // The list's refusal came back as false, not as an error, and was told and tracked as a
    // success.
    services.TemplateOptionsService.remove.mockResolvedValue(false)
    const result = await renderCatalog()
    await act(() => result.current.removePackage(TEMPLATE as any))
    expect(services.TemplateOptionsService.remove).toHaveBeenCalledWith(7)
    expect(result.current.state.notification).toEqual({
      intent: 'error',
      text: strings.CatalogRemoveErrorText
    })
    expect(trackedStatuses()).toEqual(['error'])
  })

  it('tells and tracks a template that was removed as done', async () => {
    services.TemplateOptionsService.remove.mockResolvedValue(true)
    const result = await renderCatalog()
    await act(() => result.current.removePackage(TEMPLATE as any))
    expect(result.current.state.notification).toEqual({
      intent: 'success',
      text: strings.CatalogRemoveSuccessText
    })
    expect(trackedStatuses()).toEqual(['success'])
  })

  it('tells and tracks an extension the library refused to remove as a failure', async () => {
    services.ProjectExtensionsService.remove.mockRejectedValue(new Error(''))
    const result = await renderCatalog()
    await act(() => result.current.removePackage(EXTENSION as any))
    expect(services.ProjectExtensionsService.remove).toHaveBeenCalledWith(3)
    expect(result.current.state.notification).toEqual({
      intent: 'error',
      text: strings.CatalogRemoveErrorTextExtension
    })
    expect(trackedStatuses()).toEqual(['error'])
  })

  it('tells and tracks an extension that was removed, and a template whose removal failed', async () => {
    services.ProjectExtensionsService.remove.mockResolvedValue(undefined)
    services.TemplateOptionsService.remove.mockRejectedValue(new Error(''))
    const result = await renderCatalog()
    await act(() => result.current.removePackage(EXTENSION as any))
    expect(result.current.state.notification).toEqual({
      intent: 'success',
      text: strings.CatalogRemoveSuccessTextExtension
    })
    await act(() => result.current.removePackage(CLOUD_TEMPLATE as any))
    expect(services.TemplateOptionsService.remove).toHaveBeenCalledWith(24)
    expect(result.current.state.notification).toEqual({
      intent: 'error',
      text: strings.CatalogRemoveErrorText
    })
    expect(tracked('remove')).toEqual([
      expect.objectContaining({ status: 'success', detail: { removedType: 'Importert' } }),
      expect.objectContaining({ status: 'error', previousVersion: '1.0.1' })
    ])
  })

  it('removes nothing for a package that is not installed', async () => {
    const result = await renderCatalog(() =>
      services.TemplateOptionsService.buildCrossReference.mockImplementation(() => new Map())
    )
    await act(() => result.current.removePackage(TEMPLATE as any))
    expect(services.TemplateOptionsService.remove).not.toHaveBeenCalled()
    expect(result.current.state.notification).toBeUndefined()
  })
})
