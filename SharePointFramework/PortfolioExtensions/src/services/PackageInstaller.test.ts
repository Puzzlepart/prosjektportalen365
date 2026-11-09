// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Every `@pnp/*` import maps to the one PnP stub, so this mock is
// all of them in this file: it keeps the stub and only gives `Logger` and `FunctionListener` a
// working dispatch to the listeners the installer subscribes. The engine is a stand-in that logs
// `mockEngine.lines` through them, as sp-js-provisioning's handlers do, and goes on. The hub web
// is a stand-in (`hubWeb()`) that records what the installer writes.
const mockListeners: Array<{ log: (entry: { level: number; message: string }) => void }> = []
jest.mock('@pnp/logging', () => {
  const stub = jest.requireActual('@pnp/logging')
  const Logger = {
    subscribe: (listener: any) => mockListeners.push(listener),
    log: (entry: any) => mockListeners.forEach((listener) => listener.log(entry))
  }
  return new Proxy(stub, {
    get: (target, prop) =>
      prop === 'Logger'
        ? Logger
        : prop === 'FunctionListener'
          ? (log: any) => ({ log })
          : target[prop]
  })
})
const mockEngine: {
  lines: Array<{ level: number; message: string }>
  applied: any[]
  failure?: Error
} = { lines: [], applied: [] }
jest.mock('sp-js-provisioning', () => ({
  WebProvisioner: class {
    private _prefix = ''
    public setup(config: any) {
      this._prefix = config.logging.prefix
      return this
    }
    public applyTemplate(schema: any) {
      mockEngine.applied.push(schema)
      for (const { level, message } of mockEngine.lines) {
        mockListeners.forEach((listener) =>
          listener.log({ level, message: `${this._prefix} ${message}` })
        )
      }
      return mockEngine.failure ? Promise.reject(mockEngine.failure) : Promise.resolve()
    }
  }
}))
const mockAdapter = {
  portalDataService: { web: undefined as any },
  hasTermStorePermission: jest.fn((): Promise<boolean> => Promise.resolve(true)),
  getInstalledPPVersion: jest.fn((): Promise<string | undefined> => Promise.resolve('1.15.0'))
}
jest.mock('data/SPDataAdapter', () => ({ __esModule: true, default: mockAdapter }))
const mockCompatibility = {
  check: jest.fn((..._args: any[]): Promise<any> => Promise.resolve(undefined)),
  stripConflicts: jest.fn((schema: any, _report: any) => schema)
}
jest.mock('./CompatibilityService', () => ({ CompatibilityService: mockCompatibility }))
const mockUpsertImported = jest.fn((..._args: any[]) => Promise.resolve())
jest.mock('./TemplateOptionsService', () => ({
  TemplateOptionsService: { upsertImported: mockUpsertImported }
}))

import strings from 'PortfolioExtensionsStrings'
import { format } from 'pp365-shared-library'
import resource from 'SharedResources'
import { IInstallProgress, InstallStepKey } from 'models'
import { PackageInstaller } from './PackageInstaller'

/** The `LogLevel` values of `@pnp/logging`. */
const LEVEL = { Info: 1, Warning: 2, Error: 3 }

const NO_CONFLICTS = { conflicts: [] as any[], hasConflicts: false }

const HUB_TEMPLATE = {
  SiteFields: ['<Field ID="{1ac1b8c4-7b5b-4c3e-9b3a-111111111111}" Name="GtPhase" Type="Text" />'],
  ContentTypes: [{ ID: '0x0100AB', Name: 'Byggprosjekt' }],
  Lists: [
    { Title: 'Prosjekter', ContentTypeBindings: [{ ContentTypeID: '0x0100AB' }] },
    { Title: 'Fasesjekkliste', Template: 100 }
  ]
}

const TAXONOMY = { TermSets: [{ Id: 'b1c2', Name: 'Fase' }] }

const PACKAGE = {
  id: 'pp-bygg',
  name: 'Byggprosjekt',
  version: '1.0.0',
  type: 'template',
  downloadUrl: 'https://katalog.example/pp-bygg.pppkg'
} as any

const CONTEXT = { pageContext: { web: { language: 1044 } } } as any

/** A package's manifest. */
function manifest(overrides: Record<string, any> = {}) {
  return {
    id: 'pp-bygg',
    name: 'Byggprosjekt',
    version: '1.0.0',
    type: 'template',
    provisioning: { hubTemplate: 'provisioning/hub-template.json' },
    ...overrides
  }
}

/** The files of the package `_unzip` hands out, set per test. */
let mockFiles: Record<string, string>

/** A package archive holding `files`. */
function packageZip(files: Record<string, string>) {
  return {
    file: (name: string) => (name in files ? { async: () => Promise.resolve(files[name]) } : null)
  }
}

/**
 * The hub web: the libraries and lists the installer writes to. `items` is what the List
 * content list holds; `writes` records the files, folders and item values sent.
 */
function hubWeb(items: Array<{ Id: number; Title: string }> = []) {
  const writes = {
    files: [] as Array<{ folder: string; name: string; content: string }>,
    folders: [] as string[],
    items: [] as Array<{ list: string; id: number; values: any }>
  }
  const web = {
    lists: {
      getByTitle: (title: string) => ({
        rootFolder: {
          select: () => () => Promise.resolve({ ServerRelativeUrl: `/sites/pp/${title}` })
        },
        items: {
          filter: (query: string) => ({
            select: () => ({
              top: () => () =>
                Promise.resolve(
                  items.filter((item) => query === `Title eq '${item.Title.replace(/'/g, "''")}'`)
                )
            })
          }),
          getById: (id: number) => ({
            update: (values: any) => {
              writes.items.push({ list: title, id, values })
              return Promise.resolve()
            }
          }),
          add: (values: any) => {
            const id = 100 + writes.items.length
            writes.items.push({ list: title, id, values })
            return Promise.resolve({ Id: id })
          }
        }
      })
    },
    getFolderByServerRelativePath: (folder: string) => ({
      files: {
        addUsingPath: (name: string, content: string) => {
          writes.files.push({ folder, name, content })
          return Promise.resolve({ ServerRelativeUrl: `${folder}/${name}` })
        }
      },
      folders: {
        addUsingPath: (name: string) => {
          writes.folders.push(`${folder}/${name}`)
          // The second time, as SharePoint does for a folder that exists.
          return writes.folders.filter((f) => f === `${folder}/${name}`).length > 1
            ? Promise.reject(new Error('exists'))
            : Promise.resolve()
        }
      }
    }),
    getFileByServerRelativePath: (url: string) => ({
      getItem: () =>
        Promise.resolve({
          Id: 40 + writes.files.length,
          update: (values: any) => {
            writes.items.push({ list: url, id: 40 + writes.files.length, values })
            return Promise.resolve()
          }
        })
    })
  }
  mockAdapter.portalDataService.web = web
  return writes
}

/** One line logged as sp-js-provisioning's handlers log it, after the installer's prefix. */
function engineLine(level: number, handler: string, message: string) {
  return { level, message: `(${handler}): (process): ${message}` }
}

/** A line some other part of the page logs, after the installer is done. */
function logLater(level: number, message: string) {
  mockListeners.forEach((listener) => listener.log({ level, message }))
}

beforeEach(() => {
  mockEngine.lines = []
  mockEngine.applied = []
  mockEngine.failure = undefined
  mockFiles = {
    'manifest.json': JSON.stringify(manifest()),
    'provisioning/hub-template.json': JSON.stringify(HUB_TEMPLATE)
  }
  hubWeb()
  mockAdapter.hasTermStorePermission.mockImplementation(() => Promise.resolve(true))
  mockAdapter.getInstalledPPVersion.mockImplementation(() => Promise.resolve('1.15.0'))
  mockCompatibility.check.mockReset()
  mockCompatibility.check.mockImplementation(() => Promise.resolve(NO_CONFLICTS))
  mockCompatibility.stripConflicts.mockReset()
  mockCompatibility.stripConflicts.mockImplementation((schema) => schema)
  mockUpsertImported.mockReset()
  mockUpsertImported.mockImplementation(() => Promise.resolve())
  jest.spyOn(PackageInstaller as any, '_download').mockResolvedValue(new ArrayBuffer(0))
  jest
    .spyOn(PackageInstaller as any, '_unzip')
    .mockImplementation(() => Promise.resolve(packageZip(mockFiles)))
  jest.spyOn(PackageInstaller as any, '_storeProjectFiles').mockResolvedValue(true)
})

// The advanced log re-renders on a timer; let it run before the next test.
afterEach(async () => {
  jest.restoreAllMocks()
  await new Promise((resolve) => setTimeout(resolve, 200))
})

/** Runs an import and returns its result and the last progress it reported. */
async function runImport(
  options: { pkg?: any; context?: any; featureFlagProvisioning?: boolean; onConflicts?: any } = {}
) {
  let progress: IInstallProgress
  const result = await PackageInstaller.runImport({
    package: options.pkg ?? PACKAGE,
    context: options.context ?? CONTEXT,
    featureFlagProvisioning: options.featureFlagProvisioning,
    onConflicts: options.onConflicts,
    onProgress: (next) => (progress = next)
  })
  const step = (key: InstallStepKey) => progress.steps.find((s) => s.key === key)
  return { result, progress, step, hub: step(InstallStepKey.ProvisionHub) }
}

/** Runs an import that fails, and returns its error and the last progress it reported. */
async function failedImport(pkg: any = PACKAGE) {
  let progress: IInstallProgress
  const error = await PackageInstaller.runImport({
    package: pkg,
    context: CONTEXT,
    onProgress: (next) => (progress = next)
  }).then(
    () => undefined,
    (reason: Error) => reason
  )
  return { error, progress }
}

describe('PackageInstaller, the errors sp-js-provisioning logs and goes on after', () => {
  it('ends an import whose hub provisioning logged errors as a warning, with the count and the lines in the log', async () => {
    mockEngine.lines = [
      engineLine(LEVEL.Info, 'SiteFields', 'Site column GtPhase (Fase) is unchanged.'),
      engineLine(
        LEVEL.Error,
        'SiteFields',
        'Failed to create site column GtArea (Område): refused'
      ),
      engineLine(LEVEL.Warning, 'Lists', 'Field GtOwner (Eier) in list Prosjekter is User.'),
      engineLine(LEVEL.Error, 'Lists', 'Failed to add data row 3 to list Fasesjekkliste: refused')
    ]
    const { result, progress, step, hub } = await runImport()

    expect(result).toEqual({
      completed: true,
      errors: [
        '(SiteFields): (process): Failed to create site column GtArea (Område): refused',
        '(Lists): (process): Failed to add data row 3 to list Fasesjekkliste: refused'
      ]
    })
    expect(hub).toEqual({
      key: InstallStepKey.ProvisionHub,
      status: 'warning',
      detail: format(strings.CatalogStepProvisionHubErrorsDetail, 2)
    })
    expect(progress.status).toBe('warning')
    expect(progress.provisionErrors).toBe(2)
    // The steps after the hub still ran: the template is in Maloppsett.
    expect(mockUpsertImported).toHaveBeenCalled()
    expect(step(InstallStepKey.UpdateTemplateOptions).status).toBe('done')
    // The advanced log has every line, grouped by its handler, the catalog's prefix dropped.
    expect(progress.log.filter((entry) => entry.level === 'error')).toEqual([
      {
        group: 'SiteFields',
        message: '(process): Failed to create site column GtArea (Område): refused',
        level: 'error'
      },
      {
        group: 'Lists',
        message: '(process): Failed to add data row 3 to list Fasesjekkliste: refused',
        level: 'error'
      }
    ])
    expect(progress.log.some((entry) => entry.level === 'warning')).toBe(true)

    // The capture ends with the import: a later line is not added to its log.
    const lines = progress.log.length
    logLater(LEVEL.Error, '(Other): a line after the import')
    expect(progress.log).toHaveLength(lines)
  })

  it('ends an import without errors as a success', async () => {
    mockEngine.lines = [
      engineLine(LEVEL.Warning, 'Lists', 'List Prosjekter was not made in this setup.')
    ]
    const { result, progress, hub } = await runImport()
    expect(result).toEqual({ completed: true, errors: [] })
    expect(hub.status).toBe('done')
    expect(hub.detail).toBeUndefined()
    expect(progress.status).toBe('success')
    expect(progress.provisionErrors).toBeUndefined()
  })

  it('fails an import whose provisioning throws, and stops capturing', async () => {
    mockEngine.lines = [engineLine(LEVEL.Error, 'Navigation', 'Navigation node was refused')]
    mockEngine.failure = new Error('ProvisioningError: Navigation')
    const { error, progress } = await failedImport()
    expect(error.message).toBe('ProvisioningError: Navigation')
    expect(progress.status).toBe('error')
    expect(progress.error).toBe('ProvisioningError: Navigation')
    expect(progress.steps.find((s) => s.key === InstallStepKey.ProvisionHub)).toEqual({
      key: InstallStepKey.ProvisionHub,
      status: 'error',
      detail: 'ProvisioningError: Navigation'
    })
    expect(progress.log[progress.log.length - 1]).toEqual({
      group: 'Navigation',
      message: 'ProvisioningError: Navigation',
      level: 'error'
    })
    const lines = progress.log.length
    logLater(LEVEL.Error, '(Other): a line after the import')
    expect(progress.log).toHaveLength(lines)
  })

  it("returns the errors of a cloud publish's hub dependencies, and only those", async () => {
    mockEngine.lines = [
      engineLine(LEVEL.Info, 'SiteFields', 'Site column GtPhase (Fase) is unchanged.'),
      engineLine(LEVEL.Error, 'SiteFields', 'Site column GtArea (Område) is not created.')
    ]
    const result = await PackageInstaller.provisionCloudTemplateHubDependencies(PACKAGE, CONTEXT)
    expect(result.completed).toBe(true)
    // The (Cloud) marker goes with the catalog's prefix.
    expect(result.errors).toEqual([
      '(SiteFields): (process): Site column GtArea (Område) is not created.'
    ])
    // Only the hub's part of the template: a list without bindings or rows is left out.
    expect(mockEngine.applied).toEqual([
      {
        SiteFields: HUB_TEMPLATE.SiteFields,
        ContentTypes: HUB_TEMPLATE.ContentTypes,
        Lists: [HUB_TEMPLATE.Lists[0]]
      }
    ])

    mockEngine.lines = []
    logLater(LEVEL.Error, '(Other): a line after the publish')
    expect(result.errors).toHaveLength(1)
    expect(
      (await PackageInstaller.provisionCloudTemplateHubDependencies(PACKAGE, CONTEXT)).errors
    ).toEqual([])
  })
})

describe('PackageInstaller.runImport', () => {
  it('adds the files of an extension package to Prosjekttillegg, stamped with the package, and writes nothing else', async () => {
    const extensions = [
      {
        id: 'ext-a',
        name: 'Fase A',
        file: 'extensions/FaseA.json',
        description: 'Fasene',
        defaultSelected: true,
        locked: true
      },
      { id: 'ext-b', name: 'Fase B', file: 'extensions/FaseB.json' }
    ]
    mockFiles = {
      'manifest.json': JSON.stringify(
        manifest({ type: 'extension', description: 'Pakken', provisioning: { extensions } })
      ),
      'extensions/FaseA.json': JSON.stringify({ Lists: [] }),
      // Not JSON: stored as it is, without a stamp.
      'extensions/FaseB.json': 'ikke json'
    }
    const writes = hubWeb()
    const { result, progress, step } = await runImport({ pkg: { ...PACKAGE, type: 'extension' } })

    expect(result).toEqual({ completed: true, errors: [] })
    expect(progress.status).toBe('success')
    expect(progress.steps.map((s) => s.key)).toEqual([
      InstallStepKey.Download,
      InstallStepKey.Unzip,
      InstallStepKey.ValidateManifest,
      InstallStepKey.CheckVersion,
      InstallStepKey.Extensions
    ])
    expect(step(InstallStepKey.Extensions).detail).toBe(
      format(strings.CatalogStepExtensionsDetail, 2)
    )
    const folder = `/sites/pp/${resource.Lists_ProjectExtensions_Title}`
    expect(writes.files.map(({ folder: f, name }) => `${f}/${name}`)).toEqual([
      `${folder}/FaseA.json`,
      `${folder}/FaseB.json`
    ])
    expect(JSON.parse(writes.files[0].content)).toEqual({
      Lists: [],
      PpPackage: { id: 'pp-bygg', version: '1.0.0', extensionId: 'ext-a' }
    })
    expect(writes.files[1].content).toBe('ikke json')
    // A lock is sent only when the manifest states it.
    expect(writes.items.map((item) => item.values)).toEqual([
      {
        Title: 'Fase A',
        GtDescription: 'Fasene',
        GtExtensionDefault: true,
        GtExtensionLocked: true
      },
      { Title: 'Fase B', GtDescription: 'Pakken', GtExtensionDefault: false }
    ])
    expect(mockEngine.applied).toEqual([])
    expect(mockUpsertImported).not.toHaveBeenCalled()
  })

  it('fails an extension package without extensions, or with a file it lacks', async () => {
    mockFiles = { 'manifest.json': JSON.stringify(manifest({ type: 'extension' })) }
    expect((await failedImport({ ...PACKAGE, type: 'extension' })).error.message).toBe(
      strings.CatalogNoProjectExtensions
    )
    mockFiles = {
      'manifest.json': JSON.stringify(
        manifest({
          type: 'extension',
          provisioning: { extensions: [{ id: 'x', name: 'X', file: 'extensions/X.json' }] }
        })
      )
    }
    expect((await failedImport({ ...PACKAGE, type: 'extension' })).error.message).toBe(
      format(strings.CatalogExtensionFileMissing, 'extensions/X.json')
    )
  })

  it('imports a template with its extensions and list content, and stores its project files for the wizard', async () => {
    mockFiles = {
      'manifest.json': JSON.stringify(
        manifest({
          icon: 'Building',
          provisioning: {
            hubTemplate: 'provisioning/hub-template.json',
            template: 'provisioning/template.json',
            projectContentTypeId: '0x0100AB',
            extensions: [{ id: 'ext-a', name: 'Fase A', file: 'extensions/FaseA.json' }],
            listContent: [
              { title: 'Fasesjekkliste', sourceList: 'Fasesjekkliste' },
              {
                title: "Oppgaver i 'Planner'",
                sourceList: 'Oppgaver',
                destinationList: 'Plan',
                fields: 'Title',
                default: true,
                plannerTitle: 'Prosjektplan'
              }
            ]
          },
          content: { items: [{ sourceFile: 'content/rader.json' }, { sourceFile: 'mangler.json' }] }
        })
      ),
      'provisioning/hub-template.json': JSON.stringify(HUB_TEMPLATE),
      'provisioning/template.json': '{"Lists":[]}',
      'extensions/FaseA.json': '{}',
      'content/rader.json': '[]'
    }
    jest.spyOn(PackageInstaller as any, '_storeProjectFiles').mockRestore()
    const writes = hubWeb([{ Id: 7, Title: 'Fasesjekkliste' }])
    const { result, progress, step } = await runImport()

    expect(result).toEqual({ completed: true, errors: [] })
    expect(progress.status).toBe('success')
    expect(step(InstallStepKey.ListContent).detail).toBe(
      format(strings.CatalogStepListContentDetail, 2)
    )
    expect(step(InstallStepKey.StoreProjectTemplate).status).toBe('done')
    // List content: updated by its title, or added; a Planner one as the Planner variant.
    const listContent = writes.items.filter(
      (item) => item.list === resource.Lists_ListContent_Title
    )
    expect(listContent.map(({ id }) => id)).toEqual([7, 102])
    expect(listContent[0].values).toEqual({
      Title: 'Fasesjekkliste',
      GtDescription: '',
      GtLccSourceList: 'Fasesjekkliste',
      GtLccDestinationList: 'Fasesjekkliste',
      GtLccFields: '-',
      GtLccDefault: false,
      GtLccHidden: false,
      GtLccLocked: false
    })
    expect(listContent[1].values).toMatchObject({
      GtLccDestinationList: 'Plan',
      GtLccFields: 'Title',
      GtLccDefault: true,
      ContentTypeId: '0x0100B8B4EE61A547B247B49CFC21B67D5B7D01',
      GtPlannerName: 'Prosjektplan'
    })
    // The project files, in the package's own folder of the template library.
    const store = `/sites/pp/${resource.Lists_TemplateLibrary_Title}/pp-packages`
    expect(writes.folders).toEqual([store, `${store}/pp-bygg`])
    expect(writes.files.filter((f) => f.folder === `${store}/pp-bygg`).map((f) => f.name)).toEqual([
      'template.json',
      'FaseA.json',
      'rader.json'
    ])
    expect(mockUpsertImported).toHaveBeenCalledWith(PACKAGE, undefined, {
      projectContentTypeId: '0x0100AB',
      projectStatusContentTypeId: undefined,
      projectPhaseTermSetId: undefined,
      extensionItemIds: [41],
      listContentItemIds: [7, 102],
      icon: 'Building',
      name: undefined,
      description: undefined
    })
  })

  it('stores no project files when the package has none, and goes on when storing fails', async () => {
    jest.spyOn(PackageInstaller as any, '_storeProjectFiles').mockRestore()
    expect((await runImport()).step(InstallStepKey.StoreProjectTemplate).status).toBe('skipped')
    mockAdapter.portalDataService.web = {
      lists: {
        getByTitle: () => ({ rootFolder: { select: () => () => Promise.reject(new Error('nei')) } })
      }
    }
    const { result, step } = await runImport()
    expect(result.completed).toBe(true)
    expect(step(InstallStepKey.StoreProjectTemplate).status).toBe('skipped')
  })

  it('stops before writing when the admin cancels at the compatibility prompt, and strips what the admin accepts', async () => {
    const report = {
      hasConflicts: true,
      conflicts: [{ kind: 'contentType', targetId: '0x0100AB', resolution: 'skip' }]
    }
    mockCompatibility.check.mockImplementation(() => Promise.resolve(report))
    const cancelled = await runImport({ onConflicts: () => Promise.resolve(false) })
    expect(cancelled.result).toEqual({ completed: false, errors: [] })
    expect(cancelled.progress.status).toBe('error')
    expect(cancelled.progress.error).toBe(strings.CatalogImportCancelled)
    expect(cancelled.step(InstallStepKey.CheckCompatibility).status).toBe('error')
    expect(mockEngine.applied).toEqual([])

    const accepted = await runImport({ onConflicts: () => Promise.resolve(true) })
    expect(accepted.result.completed).toBe(true)
    expect(accepted.step(InstallStepKey.CheckCompatibility)).toEqual({
      key: InstallStepKey.CheckCompatibility,
      status: 'done',
      detail: format(strings.CatalogStepCheckCompatibilityDetail, 1)
    })
    expect(mockCompatibility.stripConflicts).toHaveBeenCalledWith(HUB_TEMPLATE, report)
  })

  it('stops a taxonomy package without term store access, applies its taxonomy with it, and skips it when the flag is off', async () => {
    mockFiles['provisioning/hub-template.json'] = JSON.stringify({
      ...HUB_TEMPLATE,
      Taxonomy: TAXONOMY
    })
    mockAdapter.hasTermStorePermission.mockImplementation(() => Promise.resolve(false))
    const blocked = await runImport()
    expect(blocked.result).toEqual({ completed: false, errors: [] })
    expect(blocked.hub).toEqual({
      key: InstallStepKey.ProvisionHub,
      status: 'error',
      detail: strings.CatalogTaxonomyPermissionBlocked
    })
    expect(mockEngine.applied).toEqual([])

    mockAdapter.hasTermStorePermission.mockImplementation(() => Promise.resolve(true))
    const applied = await runImport()
    expect(applied.step(InstallStepKey.Taxonomy).status).toBe('done')
    expect(applied.progress.log.map((entry) => entry.message)).toContain(
      strings.CatalogLogTaxonomyApplied
    )
    expect(mockEngine.applied[0].Taxonomy).toEqual(TAXONOMY)

    const skipped = await runImport({ featureFlagProvisioning: false })
    expect(skipped.step(InstallStepKey.Taxonomy)).toEqual({
      key: InstallStepKey.Taxonomy,
      status: 'skipped',
      detail: strings.CatalogStepSkippedFeatureFlag
    })
    expect(mockEngine.applied[1].Taxonomy).toBeUndefined()
  })

  it("provisions the hub template of the hub's language, and names the template in it", async () => {
    mockFiles['manifest.json'] = JSON.stringify(
      manifest({
        provisioning: {
          hubTemplate: 'provisioning/hub-template.json',
          localized: {
            'en-US': {
              hubTemplate: 'provisioning/hub-template.en-US.json',
              name: 'Construction',
              description: 'Construction projects'
            }
          }
        }
      })
    )
    mockFiles['provisioning/hub-template.en-US.json'] = JSON.stringify({ SiteFields: [] })
    await runImport({ context: { pageContext: { web: { language: 1033 } } } })
    expect(mockEngine.applied[0]).toEqual({ SiteFields: [] })
    expect(mockUpsertImported.mock.calls[0][2]).toMatchObject({
      name: 'Construction',
      description: 'Construction projects'
    })
    // Without a site language, the UI culture decides; Norwegian is the default.
    await runImport({
      context: { pageContext: { cultureInfo: { currentUICultureName: 'en-GB' } } }
    })
    expect(mockEngine.applied[1]).toEqual({ SiteFields: [] })
    await runImport({ context: {} })
    expect(mockEngine.applied[2]).toEqual(HUB_TEMPLATE)
  })

  it('refuses a package for a newer Prosjektportalen, and goes on with a note when the version is unknown', async () => {
    mockFiles['manifest.json'] = JSON.stringify(manifest({ minPPVersion: '1.16.0' }))
    expect((await failedImport()).error.message).toBe(
      format(strings.CatalogMinVersionError, '1.16.0')
    )
    // No version in the installation log.
    mockAdapter.getInstalledPPVersion.mockImplementation(() => Promise.resolve(undefined))
    const { result, step } = await runImport()
    expect(result.completed).toBe(true)
    expect(step(InstallStepKey.CheckVersion).detail).toBe('(?) 1.16.0')
  })

  it('refuses a package without a manifest it can read, or without the hub template it names', async () => {
    mockFiles = {}
    expect((await failedImport()).error.message).toBe(strings.CatalogManifestMissing)
    mockFiles = { 'manifest.json': '{' }
    expect((await failedImport()).error.message).toBe(strings.CatalogManifestInvalidJson)
    mockFiles = { 'manifest.json': JSON.stringify({ id: 'pp-bygg', version: '1.0.0' }) }
    expect((await failedImport()).error.message).toBe(strings.CatalogManifestMissingFields)
    mockFiles = { 'manifest.json': JSON.stringify(manifest()) }
    expect((await failedImport()).error.message).toBe(
      format(strings.CatalogHubTemplateMissing, 'provisioning/hub-template.json')
    )
  })

  it('downloads the package, and says so when the download is refused', async () => {
    jest.spyOn(PackageInstaller as any, '_download').mockRestore()
    const fetch = jest.fn((url: string) =>
      Promise.resolve(
        url === PACKAGE.downloadUrl
          ? { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }
          : { ok: false, status: 404, statusText: 'Not Found' }
      )
    )
    const original = (globalThis as any).fetch
    ;(globalThis as any).fetch = fetch
    try {
      expect((await runImport()).result.completed).toBe(true)
      expect(fetch).toHaveBeenCalledWith(PACKAGE.downloadUrl, { method: 'GET' })
      expect(
        (await failedImport({ ...PACKAGE, downloadUrl: 'https://katalog.example/borte.pppkg' }))
          .error.message
      ).toBe(format(strings.CatalogDownloadError, '404 Not Found'))
    } finally {
      ;(globalThis as any).fetch = original
    }
  })
})

describe('PackageInstaller.provisionCloudTemplateHubDependencies', () => {
  it("applies the hub's part: columns, content types, bindings, configuration rows and taxonomy", async () => {
    mockFiles['manifest.json'] = JSON.stringify(
      manifest({
        provisioning: {
          hubTemplate: 'provisioning/hub-template.json',
          listContent: [{ title: 'Sjekkliste', sourceList: 'Sjekkliste' }],
          localized: { 'nb-NO': { name: 'Bygg', description: 'Byggprosjekter' } }
        }
      })
    )
    const rows = { Title: 'Prosjektkolonner', DataRows: { Rows: [{ Title: 'Fase' }] } }
    const source = { Title: 'Sjekkliste', DataRows: { Rows: [{ Title: 'Punkt' }] } }
    mockFiles['provisioning/hub-template.json'] = JSON.stringify({
      ...HUB_TEMPLATE,
      Lists: [...HUB_TEMPLATE.Lists, rows, source],
      Taxonomy: TAXONOMY
    })
    const result = await PackageInstaller.provisionCloudTemplateHubDependencies(PACKAGE, CONTEXT)
    expect(result).toMatchObject({
      completed: true,
      taxonomySkipped: false,
      localizedName: 'Bygg',
      localizedDescription: 'Byggprosjekter',
      errors: []
    })
    expect(mockEngine.applied).toEqual([
      {
        SiteFields: HUB_TEMPLATE.SiteFields,
        ContentTypes: HUB_TEMPLATE.ContentTypes,
        Lists: [HUB_TEMPLATE.Lists[0], rows],
        Taxonomy: TAXONOMY
      }
    ])
    // The compatibility check sees only that part, without the extensions.
    expect(mockCompatibility.check.mock.calls[0][3]).toEqual({
      schema: mockEngine.applied[0],
      includeExtensions: false
    })

    // Taxonomy: skipped with the flag off, refused without term store access.
    const skipped = await PackageInstaller.provisionCloudTemplateHubDependencies(PACKAGE, CONTEXT, {
      featureFlagProvisioning: false
    })
    expect(skipped.taxonomySkipped).toBe(true)
    expect(mockEngine.applied[1].Taxonomy).toBeUndefined()
    mockAdapter.hasTermStorePermission.mockImplementation(() => Promise.resolve(false))
    await expect(
      PackageInstaller.provisionCloudTemplateHubDependencies(PACKAGE, CONTEXT)
    ).rejects.toThrow(strings.CatalogTaxonomyPermissionBlocked)
  })

  it('writes nothing for a package without hub dependencies, or when the admin cancels', async () => {
    mockFiles['manifest.json'] = JSON.stringify(manifest({ provisioning: {} }))
    expect(
      await PackageInstaller.provisionCloudTemplateHubDependencies(PACKAGE, CONTEXT)
    ).toMatchObject({ completed: true, errors: [] })

    mockFiles['manifest.json'] = JSON.stringify(manifest())
    mockFiles['provisioning/hub-template.json'] = JSON.stringify({
      Lists: [{ Title: 'Fasesjekkliste', Template: 100 }]
    })
    expect(
      (await PackageInstaller.provisionCloudTemplateHubDependencies(PACKAGE, CONTEXT)).completed
    ).toBe(true)
    expect(mockEngine.applied).toEqual([])

    mockFiles['provisioning/hub-template.json'] = JSON.stringify(HUB_TEMPLATE)
    const report = { hasConflicts: true, conflicts: [{ kind: 'contentType' }] }
    mockCompatibility.check.mockImplementation(() => Promise.resolve(report))
    const cancelled = await PackageInstaller.provisionCloudTemplateHubDependencies(
      PACKAGE,
      CONTEXT,
      { onConflicts: () => Promise.resolve(false) }
    )
    expect(cancelled.completed).toBe(false)
    expect(mockEngine.applied).toEqual([])

    await PackageInstaller.provisionCloudTemplateHubDependencies(PACKAGE, CONTEXT)
    expect(mockCompatibility.stripConflicts).toHaveBeenCalledWith(mockEngine.applied[0], report)

    delete mockFiles['provisioning/hub-template.json']
    await expect(
      PackageInstaller.provisionCloudTemplateHubDependencies(PACKAGE, CONTEXT)
    ).rejects.toThrow(format(strings.CatalogHubTemplateMissing, 'provisioning/hub-template.json'))
  })
})
