import JSZip from 'jszip'
import { CloudTemplatePackage } from './CloudTemplatePackage'

/**
 * A cloud template is a zip (`.pppkg`) with a manifest that names the files the setup reads. The
 * package is built here with JSZip and served through a `fetch` stand-in.
 */
async function serve(files: Record<string, unknown>, response: Partial<Response> = {}) {
  const zip = new JSZip()
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, typeof content === 'string' ? content : JSON.stringify(content))
  }
  const buffer = await zip.generateAsync({ type: 'arraybuffer' })
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: () => Promise.resolve(buffer),
      ...response
    })
  ) as any
}

const MANIFEST = {
  name: 'Byggeprosjekt',
  provisioning: { template: 'template.json', hubTemplate: 'hub.json' }
}
const HUB = {
  Lists: [
    {
      Title: 'Fasesjekkliste',
      DataRows: { KeyColumn: 'Title', Rows: [{ Title: 'Mål er definert' }] },
      Folders: [{ Name: 'Maler', Folders: [{ Name: 'Kontrakter' }] }]
    }
  ]
}

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
})

describe('CloudTemplatePackage', () => {
  it('reads the manifest and the files it names', async () => {
    await serve({
      'manifest.json': MANIFEST,
      'template.json': { Parameters: { ProvisionSiteFields: 'Ja' } },
      'hub.json': HUB
    })
    const pkg = await CloudTemplatePackage.fromUrl('https://katalog.example/bygg.pppkg')
    expect(global.fetch).toHaveBeenCalledWith('https://katalog.example/bygg.pppkg', {
      method: 'GET'
    })
    expect(pkg.manifest.name).toBe('Byggeprosjekt')
    expect(await pkg.getProjectTemplateSchema()).toEqual({
      Parameters: { ProvisionSiteFields: 'Ja' }
    })
    expect(await pkg.getHubListDataRows('Fasesjekkliste')).toEqual(HUB.Lists[0].DataRows)
    expect(await pkg.getHubListFolders('Fasesjekkliste')).toEqual(HUB.Lists[0].Folders)
    expect(await pkg.getHubListDataRows('Ukjent liste')).toBeUndefined()
  })

  it('has an empty template and no hub lists when the manifest names none', async () => {
    await serve({ 'manifest.json': { name: 'Tom' } })
    const pkg = await CloudTemplatePackage.fromUrl('https://katalog.example/tom.pppkg')
    expect(await pkg.getProjectTemplateSchema()).toEqual({ Parameters: {} })
    expect(await pkg.getHubListFolders('Fasesjekkliste')).toBeUndefined()
  })

  it('reads an extension by its file, and says which file is missing', async () => {
    await serve({ 'manifest.json': MANIFEST, 'extensions/gevinst.json': { Lists: [] } })
    const pkg = await CloudTemplatePackage.fromUrl('https://katalog.example/bygg.pppkg')
    expect(await pkg.getExtensionSchema('extensions/gevinst.json')).toEqual({ Lists: [] })
    await expect(pkg.getExtensionSchema('extensions/borte.json')).rejects.toThrow(
      'extensions/borte.json not found in package'
    )
  })

  it('refuses a missing address, a failed download and a package without a usable manifest', async () => {
    await expect(CloudTemplatePackage.fromUrl('')).rejects.toThrow('URL is missing')
    await serve({}, { ok: false, status: 404, statusText: 'Not Found' })
    await expect(
      CloudTemplatePackage.fromUrl('https://katalog.example/borte.pppkg')
    ).rejects.toThrow('HTTP 404 Not Found')
    await serve({ 'readme.txt': 'Ingen manifest' })
    await expect(CloudTemplatePackage.fromUrl('https://katalog.example/x.pppkg')).rejects.toThrow(
      'manifest.json not found in package'
    )
    await serve({ 'manifest.json': '{ ikke json' })
    await expect(CloudTemplatePackage.fromUrl('https://katalog.example/x.pppkg')).rejects.toThrow(
      'manifest.json is not valid JSON'
    )
  })
})
