// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter reaches the hub; it is a stand-in that answers
// with the template options list's (Maloppsett) items and records what is written to the list.
const mockList = { items: [] as any[], failure: undefined as Error | undefined }
const mockPortal = {
  web: {
    lists: {
      getByTitle: () => ({
        items: {
          select: () => ({
            top: () => () =>
              mockList.failure ? Promise.reject(mockList.failure) : Promise.resolve(mockList.items)
          })
        }
      })
    }
  },
  addItemToList: jest.fn((..._args: any[]) => Promise.resolve()),
  updateItemInList: jest.fn((..._args: any[]) => Promise.resolve()),
  deleteItemFromList: jest.fn((..._args: any[]) => Promise.resolve(true))
}
jest.mock('data/SPDataAdapter', () => ({
  __esModule: true,
  default: { portalDataService: mockPortal }
}))

import { PackageBadge, PpPkgType, TemplateOptionsItem } from 'models'
import { TemplateOptionsService } from './TemplateOptionsService'

/**
 * The template options list (Maloppsett) as the template package catalog reads and writes it: the
 * items matched to the catalog, a package copied to the installation, and a cloud template
 * registered and updated.
 */
const PACKAGE = {
  id: 'Forskningsprosjekt',
  name: 'Forskningsprosjekt',
  description: 'Mal for forskningsprosjekter',
  version: '1.0.2',
  type: 'template',
  downloadUrl: 'https://katalog.example/forskningsprosjekt-1.0.2.pppkg'
} as any

/** The content types and the phase term set a package's manifest declares. */
const IDS = {
  projectContentTypeId: '0x0100AB',
  projectStatusContentTypeId: '0x0100CD',
  projectPhaseTermSetId: 'fase-termsett'
}
const ID_FIELDS = {
  GtProjectContentType: IDS.projectContentTypeId,
  GtProjectStatusContentType: IDS.projectStatusContentTypeId,
  GtProjectPhaseTermId: IDS.projectPhaseTermSetId
}

beforeEach(() => {
  jest.clearAllMocks()
  mockList.items = []
  mockList.failure = undefined
})

describe('TemplateOptionsService, cloud templates', () => {
  it('registers a cloud template as a new item, with the content types and phases of its manifest', async () => {
    await TemplateOptionsService.createCentral(PACKAGE, { ...IDS, name: 'Research project' })
    const [list, fields] = mockPortal.addItemToList.mock.calls[0]
    expect(list).toBe('PROJECT_TEMPLATE_CONFIGURATION')
    expect(fields).toMatchObject({
      Title: 'Research project',
      GtDescription: PACKAGE.description,
      GtProjectTemplateId: 1,
      IconName: 'Cloud',
      PpPkgType: PpPkgType.Sentral,
      PpPkgId: PACKAGE.id,
      PpPkgVersion: '1.0.2',
      PpPkgLatestVersion: '1.0.2',
      PpPkgSourceUrl: { Url: PACKAGE.downloadUrl, Description: PACKAGE.name },
      PpPkgInstalledDate: expect.any(String),
      ...ID_FIELDS
    })
  })

  it("updates a cloud template's item in place to the newer version, which stays a cloud template", async () => {
    // The update went through the import, which wrote a local install over the item.
    await TemplateOptionsService.updateCentral(24, PACKAGE, IDS)
    expect(mockPortal.addItemToList).not.toHaveBeenCalled()
    const [list, itemId, fields] = mockPortal.updateItemInList.mock.calls[0]
    expect([list, itemId]).toEqual(['PROJECT_TEMPLATE_CONFIGURATION', 24])
    expect(fields).toMatchObject({
      Title: PACKAGE.name,
      GtDescription: PACKAGE.description,
      PpPkgType: PpPkgType.Sentral,
      PpPkgVersion: '1.0.2',
      PpPkgLatestVersion: '1.0.2',
      PpPkgSourceUrl: { Url: PACKAGE.downloadUrl, Description: PACKAGE.name },
      PpPkgUpdatedDate: expect.any(String),
      ...ID_FIELDS
    })
    // What the admin may have changed, and when it was registered, are kept.
    for (const field of ['IconName', 'GtProjectTemplateId', 'PpPkgId', 'PpPkgInstalledDate']) {
      expect(fields).not.toHaveProperty(field)
    }
  })

  it('leaves out what the manifest does not declare', async () => {
    const pkg = { ...PACKAGE, description: undefined }
    await TemplateOptionsService.createCentral(pkg)
    await TemplateOptionsService.updateCentral(24, pkg)
    for (const fields of [
      mockPortal.addItemToList.mock.calls[0][1],
      mockPortal.updateItemInList.mock.calls[0][2]
    ]) {
      expect(fields).toMatchObject({ Title: PACKAGE.name, GtDescription: '' })
      for (const field of Object.keys(ID_FIELDS)) expect(fields).not.toHaveProperty(field)
    }
  })
})

describe('TemplateOptionsService, the installed packages', () => {
  it('reads the items, and none when the list cannot be read', async () => {
    mockList.items = [
      {
        Id: 24,
        Title: 'Forskningsprosjekt',
        PpPkgType: 'Sentral',
        PpPkgId: ' Forskningsprosjekt ',
        PpPkgVersion: '1.0.1',
        PpPkgSourceUrl: { Url: PACKAGE.downloadUrl }
      }
    ]
    const [item] = await TemplateOptionsService.getItems()
    expect(item).toBeInstanceOf(TemplateOptionsItem)
    expect(item).toMatchObject({
      id: 24,
      packageType: PpPkgType.Sentral,
      packageId: 'Forskningsprosjekt',
      version: '1.0.1',
      sourceUrl: PACKAGE.downloadUrl
    })
    mockList.failure = new Error('Feltene finnes ikke')
    expect(await TemplateOptionsService.getItems()).toEqual([])
  })

  it("matches the items to the catalog's packages by id, with their state and whether a newer version is out", () => {
    const item = (fields: Record<string, any>) =>
      new TemplateOptionsItem({ Id: 0, Title: '', ...fields })
    const catalog = {
      packages: [
        { id: 'Byggprosjekt', version: '2.0.0' },
        { id: 'Forskningsprosjekt', version: '1.0.2' }
      ]
    } as any
    const refs = TemplateOptionsService.buildCrossReference(
      [
        item({ Id: 7, PpPkgType: 'Importert', PpPkgId: 'Byggprosjekt', PpPkgVersion: '2.0.0' }),
        item({
          Id: 24,
          PpPkgType: 'Sentral',
          PpPkgId: 'Forskningsprosjekt',
          PpPkgVersion: '1.0.1'
        }),
        // Gone from the catalog: the latest version the list recorded counts.
        item({
          Id: 8,
          PpPkgType: 'Importert',
          PpPkgId: 'Anleggsprosjekt',
          PpPkgVersion: '1.0.0',
          PpPkgLatestVersion: '1.1.0'
        }),
        item({ Id: 30, PpPkgId: 'Egenmal', PpPkgVersion: '1.0.0' }),
        // A template made in the installation, not from the catalog.
        item({ Id: 1, Title: 'Standardmal' })
      ],
      catalog
    )
    expect([...refs.keys()]).toEqual([
      'byggprosjekt',
      'forskningsprosjekt',
      'anleggsprosjekt',
      'egenmal'
    ])
    expect(refs.get('byggprosjekt')).toEqual({
      itemId: 7,
      packageType: PpPkgType.Importert,
      installedVersion: '2.0.0',
      updateAvailable: false,
      badge: PackageBadge.Installed
    })
    expect(refs.get('forskningsprosjekt')).toMatchObject({
      itemId: 24,
      updateAvailable: true,
      badge: PackageBadge.Central
    })
    expect(refs.get('anleggsprosjekt')).toMatchObject({
      updateAvailable: true,
      badge: PackageBadge.UpdateAvailable
    })
    expect(refs.get('egenmal')).toMatchObject({
      packageType: PpPkgType.Lokal,
      updateAvailable: false,
      badge: PackageBadge.None
    })
  })

  it('writes a copied package as a new item or over its own install, with what the import provisioned', async () => {
    await TemplateOptionsService.upsertImported(PACKAGE, undefined, {
      ...IDS,
      extensionItemIds: [3],
      listContentItemIds: [11, 12],
      icon: 'Beaker',
      name: 'Research project',
      description: 'For research'
    })
    expect(mockPortal.addItemToList.mock.calls[0][1]).toMatchObject({
      Title: 'Research project',
      GtDescription: 'For research',
      IconName: 'Beaker',
      PpPkgType: PpPkgType.Importert,
      PpPkgVersion: '1.0.2',
      GtProjectExtensionsId: [3],
      ListContentConfigLookupId: [11, 12],
      PpPkgInstalledDate: expect.any(String),
      ...ID_FIELDS
    })
    await TemplateOptionsService.upsertImported({ ...PACKAGE, description: undefined }, 7)
    const [, itemId, fields] = mockPortal.updateItemInList.mock.calls[0]
    expect(itemId).toBe(7)
    expect(fields).toMatchObject({
      Title: PACKAGE.name,
      GtDescription: '',
      IconName: 'Page',
      PpPkgType: PpPkgType.Importert
    })
    for (const field of [
      'GtProjectExtensionsId',
      'PpPkgInstalledDate',
      ...Object.keys(ID_FIELDS)
    ]) {
      expect(fields).not.toHaveProperty(field)
    }
  })

  it('records the latest version out, and removes an item', async () => {
    await TemplateOptionsService.refreshLatestVersion(24, '1.0.2')
    expect(mockPortal.updateItemInList).toHaveBeenCalledWith('PROJECT_TEMPLATE_CONFIGURATION', 24, {
      PpPkgLatestVersion: '1.0.2'
    })
    expect(await TemplateOptionsService.remove(24)).toBe(true)
    expect(mockPortal.deleteItemFromList).toHaveBeenCalledWith('PROJECT_TEMPLATE_CONFIGURATION', 24)
  })
})
