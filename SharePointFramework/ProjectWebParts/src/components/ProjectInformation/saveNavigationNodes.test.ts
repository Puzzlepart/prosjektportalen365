import { NAVIGATION_NODES_STORAGE_KEY, saveNavigationNodes } from './saveNavigationNodes'

const PROJECT = 'https://contoso.sharepoint.com/sites/frisbee'
const NODES = [
  { Title: 'Hjem', SimpleUrl: '/sites/frisbee/SitePages/ProjectHome.aspx', Nodes: [] },
  { Title: 'Banekart', SimpleUrl: 'https://kart.contoso.no/frisbee', Nodes: [] }
] as any[]

/** The site's PnPjs instance, reading the menu or failing to. */
const site = (menu: Promise<{ Nodes: any[] }>) => ({ navigation: { getMenuState: () => menu } })

let consoleError: jest.SpyInstance

beforeEach(() => {
  localStorage.clear()
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => consoleError.mockRestore())

describe('saveNavigationNodes', () => {
  it('saves the Quick Launch with the URL of its web', async () => {
    await saveNavigationNodes(site(Promise.resolve({ Nodes: NODES })), PROJECT)
    expect(JSON.parse(localStorage.getItem(NAVIGATION_NODES_STORAGE_KEY))).toEqual({
      webUrl: PROJECT,
      nodes: NODES
    })
  })

  it('removes an earlier save, and goes on, when the menu cannot be read', async () => {
    localStorage.setItem(
      NAVIGATION_NODES_STORAGE_KEY,
      JSON.stringify({ webUrl: 'https://contoso.sharepoint.com/sites/alfa', nodes: NODES })
    )
    await saveNavigationNodes(site(Promise.reject(new Error('Tilgang nektet'))), PROJECT)
    expect(localStorage.getItem(NAVIGATION_NODES_STORAGE_KEY)).toBeNull()
    expect(consoleError).toHaveBeenCalled()
  })
})
