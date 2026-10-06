import {
  buildCustomActionPayload,
  ensureProjectFolder,
  getSelectedItems,
  isCorsError,
  stampSiteIdFields,
  stampSiteIdFieldsOnFile
} from './listOperationUtils'

/**
 * The dynamic list's operations on its rows and its list: the selected rows from their indices, the
 * site stamp on a new item or file (skipped without a site, never failing the save), the payload a
 * custom action posts, a network error told apart, and the project folder ensured. The lists, webs
 * and files are structural stand-ins for PnPjs, which cannot load under Jest.
 */
const listItems = [{ Title: 'Design av bane' }, { Title: 'Åpning' }, { Title: 'Baneplan' }]

const context = (props: Record<string, any> = {}, state: Record<string, any> = {}) =>
  ({
    props: { listName: 'Oppgaver', siteId: 'site-1', webTitle: 'Frisbeegolf', ...props },
    state: { data: { listItems, listId: 'list-1', listTitle: 'Oppgaver' }, ...state }
  }) as any

/** A list whose item `getById(id).update(...)` records its calls. */
function listStandIn(update = jest.fn().mockResolvedValue(undefined)) {
  const getById = jest.fn(() => ({ update }))
  return { list: { items: { getById } }, getById, update }
}

let logged: jest.SpyInstance

beforeEach(() => {
  logged = jest.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

describe('getSelectedItems', () => {
  it('maps the selected indices to their rows, in selection order, dropping unknown ones', () => {
    expect(getSelectedItems(context({}, { selectedItems: [2, 0, 7] }))).toEqual([
      { Title: 'Baneplan' },
      { Title: 'Design av bane' }
    ])
    expect(getSelectedItems(context())).toEqual([])
  })
})

describe('stampSiteIdFields', () => {
  it('stamps the site id and title that are given, and nothing without either', async () => {
    const { list, getById, update } = listStandIn()
    await stampSiteIdFields(list, 4, 'site-1', 'Frisbeegolf')
    expect(getById).toHaveBeenCalledWith(4)
    expect(update).toHaveBeenLastCalledWith({ GtSiteId: 'site-1', GtSiteTitle: 'Frisbeegolf' })
    await stampSiteIdFields(list, 4, undefined, 'Frisbeegolf')
    expect(update).toHaveBeenLastCalledWith({ GtSiteTitle: 'Frisbeegolf' })
    update.mockClear()
    await stampSiteIdFields(list, 4)
    expect(update).not.toHaveBeenCalled()
  })

  it('logs a failed stamp without failing the save', async () => {
    const { list } = listStandIn(jest.fn().mockRejectedValue(new Error('Ingen tilgang')))
    await expect(stampSiteIdFields(list, 4, 'site-1')).resolves.toBeUndefined()
    expect(logged).toHaveBeenCalled()
  })
})

describe('stampSiteIdFieldsOnFile', () => {
  it("stamps the added file's list item, found by its path, and logs a failure", async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    const getFileByServerRelativePath = jest.fn(() => ({
      getItem: jest.fn().mockResolvedValue({ update })
    }))
    const web = { getFileByServerRelativePath } as any
    const file = { ServerRelativeUrl: '/sites/frisbeegolf/Dokumenter/plan.docx' } as any
    await stampSiteIdFieldsOnFile(web, file, 'site-1', 'Frisbeegolf')
    expect(getFileByServerRelativePath).toHaveBeenCalledWith(file.ServerRelativeUrl)
    expect(update).toHaveBeenCalledWith({ GtSiteId: 'site-1', GtSiteTitle: 'Frisbeegolf' })
    getFileByServerRelativePath.mockClear()
    await stampSiteIdFieldsOnFile(web, file)
    expect(getFileByServerRelativePath).not.toHaveBeenCalled()
    update.mockRejectedValueOnce(new Error('Låst'))
    await expect(stampSiteIdFieldsOnFile(web, file, 'site-1')).resolves.toBeUndefined()
    expect(logged).toHaveBeenCalled()
  })
})

describe('isCorsError', () => {
  it('tells a network or CORS error from any other', () => {
    expect(isCorsError(new TypeError('Failed to fetch'))).toBe(true)
    expect(isCorsError({ message: 'NetworkError when attempting to fetch resource.' })).toBe(true)
    expect(isCorsError({ message: 'Blocked by CORS policy' })).toBe(true)
    expect(isCorsError(new Error('Ingen tilgang'))).toBe(false)
    expect(isCorsError(undefined)).toBe(false)
  })
})

describe('buildCustomActionPayload', () => {
  it('describes the list, the site, the selected rows, the user and the time', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-06T12:00:00Z'))
    const user = { displayName: 'Kari', email: 'kari@kommune.no', loginName: 'i:0#.f|kari' }
    const payload = buildCustomActionPayload(
      context({ webUrl: '/sites/frisbeegolf', pageContext: { user } }),
      'Send til godkjenning',
      [listItems[1]]
    )
    expect(payload).toEqual({
      listName: 'Oppgaver',
      listId: 'list-1',
      listTitle: 'Oppgaver',
      webUrl: '/sites/frisbeegolf',
      siteId: 'site-1',
      siteTitle: 'Frisbeegolf',
      selectedItems: [listItems[1]],
      currentUser: user,
      timestamp: '2026-10-06T12:00:00.000Z',
      actionName: 'Send til godkjenning'
    })
  })

  it("falls back on the page's web address, and has no user without one", () => {
    const payload = buildCustomActionPayload(
      context({ pageContext: { web: { absoluteUrl: 'https://kommune.sharepoint.com/sites/a' } } }),
      'Arkiver',
      []
    )
    expect(payload.webUrl).toBe('https://kommune.sharepoint.com/sites/a')
    expect(payload.currentUser).toBeNull()
  })
})

describe('ensureProjectFolder', () => {
  function folderList(exists: boolean) {
    const folder = jest.fn(() => (exists ? Promise.resolve({}) : Promise.reject(new Error('404'))))
    const getByUrl = jest.fn(() => folder)
    const addUsingPath = jest.fn().mockResolvedValue({})
    return { list: { rootFolder: { folders: { getByUrl, addUsingPath } } }, getByUrl, addUsingPath }
  }

  it('uses an existing folder, and adds a missing one', async () => {
    const existing = folderList(true)
    await expect(ensureProjectFolder(existing.list, 'Frisbeegolf')).resolves.toBe('Frisbeegolf')
    expect(existing.getByUrl).toHaveBeenCalledWith('Frisbeegolf')
    expect(existing.addUsingPath).not.toHaveBeenCalled()
    const missing = folderList(false)
    await expect(ensureProjectFolder(missing.list, 'Frisbeegolf')).resolves.toBe('Frisbeegolf')
    expect(missing.addUsingPath).toHaveBeenCalledWith('Frisbeegolf')
  })

  it('keeps the folder the user has navigated to', async () => {
    const { list } = folderList(true)
    await expect(ensureProjectFolder(list, 'Frisbeegolf', 'Frisbeegolf/Planer')).resolves.toBe(
      'Frisbeegolf/Planer'
    )
  })
})
