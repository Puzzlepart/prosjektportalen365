import { fetchShieldedProjectItems, isShieldedProjectItem } from './shieldedChildProjects'

const PROJECT = '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C'
const LIST_COPY = `${PROJECT}00A1B2C3D4E5F60718293A4B5C6D7E8F90`
const SITE = 'a2f7c7f5-37d5-4d6f-9d6b-0d0f5a6b7c8d'
const url = (name: string) => `https://contoso.sharepoint.com/sites/${name}`

/** The properties item the setup leaves on a shielded project's site. */
const shieldedItem = (siteId: string, properties: Record<string, any> = {}) => ({
  Id: 1,
  ContentTypeId: LIST_COPY,
  GtSiteId: siteId,
  ...properties
})

/** The properties item of a project that is not shielded: no project content type, no site ID. */
const plainItem = { Id: 1, ContentTypeId: '0x010000F1E2D3C4B5A60718293A4B5C6D7E8F90' }

describe('isShieldedProjectItem', () => {
  it("knows a shielded project's properties item by the hub entries' content type and the site's ID", () => {
    expect(isShieldedProjectItem(shieldedItem(SITE), SITE)).toBe(true)
    // The site ID as search and the page give it: in braces, in upper case.
    expect(isShieldedProjectItem(shieldedItem(SITE), `{${SITE.toUpperCase()}}`)).toBe(true)
    // A template's own project content type, built on the hub entries'.
    const ownContentType = `${LIST_COPY}00B1B2C3D4E5F60718293A4B5C6D7E8F91`.toLowerCase()
    expect(isShieldedProjectItem(shieldedItem(SITE, { ContentTypeId: ownContentType }), SITE)).toBe(
      true
    )
  })

  it('is not the properties item every other project site has', () => {
    expect(isShieldedProjectItem(plainItem, SITE)).toBe(false)
    expect(isShieldedProjectItem({ ...plainItem, GtSiteId: SITE }, SITE)).toBe(false)
    expect(isShieldedProjectItem(shieldedItem(''), SITE)).toBe(false)
    expect(isShieldedProjectItem(shieldedItem('another-site'), SITE)).toBe(false)
    expect(isShieldedProjectItem(shieldedItem(''), '')).toBe(false)
    expect(isShieldedProjectItem(undefined, SITE)).toBe(false)
  })
})

describe('fetchShieldedProjectItems', () => {
  /** Project sites by address, and the addresses read. */
  function sites(items: Record<string, Record<string, any> | Error | undefined>) {
    const read: string[] = []
    const readItem = (address: string) => {
      read.push(address)
      const item = items[address]
      return item instanceof Error ? Promise.reject(item) : Promise.resolve(item)
    }
    return { read, readItem }
  }

  it("reads the properties items of the program's projects that the hub has no entry for, each once, and keeps the shielded ones", async () => {
    const { read, readItem } = sites({
      [url('skjermet')]: shieldedItem('shielded', {
        Title: 'Skjermet',
        GtSiteUrl: url('skjermet')
      }),
      // A closed project: the hub's query leaves its entry out, and it is not shielded.
      [url('avsluttet')]: plainItem
    })
    const items = await fetchShieldedProjectItems(
      [
        { siteId: 'in-hub', url: url('vanlig') },
        { siteId: 'shielded', url: url('skjermet') },
        { siteId: '{SHIELDED}', url: url('skjermet') },
        { siteId: 'closed', url: url('avsluttet') }
      ],
      [{ GtSiteId: 'IN-HUB' }],
      readItem
    )
    expect(items).toEqual([
      shieldedItem('shielded', { Title: 'Skjermet', GtSiteUrl: url('skjermet') })
    ])
    expect(read).toEqual([url('skjermet'), url('avsluttet')])
  })

  it('leaves out a site the user may not read or that has no item, and keeps the others', async () => {
    const { readItem } = sites({
      [url('nektet')]: Object.assign(new Error('403 FORBIDDEN'), { status: 403 }),
      [url('tom')]: undefined,
      [url('skjermet')]: shieldedItem('c')
    })
    const items = await fetchShieldedProjectItems(
      [
        { siteId: 'a', url: url('nektet') },
        { siteId: 'b', url: url('tom') },
        { siteId: 'c', url: url('skjermet') }
      ],
      [],
      readItem
    )
    // The item names its site as the hub's entries do, also where the setup left it out.
    expect(items).toEqual([shieldedItem('c', { GtSiteUrl: url('skjermet') })])
  })

  it('reads nothing when the hub has an entry for every project, or the program has no projects', async () => {
    const { read, readItem } = sites({})
    const inHub = [{ GtSiteId: 'a' }]
    expect(
      await fetchShieldedProjectItems([{ siteId: 'A', url: url('a') }], inHub, readItem)
    ).toEqual([])
    expect(await fetchShieldedProjectItems(undefined, inHub, readItem)).toEqual([])
    // A project without a site ID or an address cannot be read.
    const unknown = [
      { siteId: '', url: url('x') },
      { siteId: 'y', url: '' }
    ]
    expect(await fetchShieldedProjectItems(unknown, [], readItem)).toEqual([])
    expect(read).toEqual([])
  })
})
