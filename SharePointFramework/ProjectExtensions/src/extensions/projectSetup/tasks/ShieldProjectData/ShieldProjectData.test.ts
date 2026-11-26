// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The service that builds the lists is a stand-in that records
// what it is asked for, in order, fails on the list named in `service.failOn`, and logs
// `service.warning` as the real one logs what it goes on without; the hub is the web the data
// adapter hands it. `@pnp/logging` gets a working `Logger`, which the service and the setup share
// on a page.
jest.mock('@pnp/logging', () => jest.requireActual('../testFixtures').fakeLogging())
const HUB_WEB = { hub: true }
const service = {
  made: [] as any[][],
  lists: [] as Record<string, any>[],
  itemsContentType: [] as any[][],
  failOn: undefined as string | undefined,
  warning: undefined as string | undefined
}
class FakeShieldedProjectService {
  constructor(...args: any[]) {
    service.made.push(args)
  }
  public ensureList(params: Record<string, any>) {
    if (params.listName === service.failOn) return Promise.reject(new Error('Tilgang nektet'))
    if (service.warning) jest.requireMock('@pnp/logging').Logger.write(service.warning, 2)
    service.lists.push(params)
    return Promise.resolve({
      list: {},
      created: true,
      listContentTypeId: params.contentTypeId ? `${params.contentTypeId}00LISTCOPY` : undefined
    })
  }
  public setItemsContentType(...args: any[]) {
    service.itemsContentType.push(args)
    return Promise.resolve()
  }
}
jest.mock('pp365-shared-library', () => ({
  __esModule: true,
  ...jest.requireActual('pp365-shared-library'),
  ShieldedProjectService: FakeShieldedProjectService
}))
jest.mock('data/SPDataAdapter', () => ({
  __esModule: true,
  default: { portalDataService: { web: HUB_WEB } }
}))

import strings from 'ProjectExtensionsStrings'
import resource from 'SharedResources'
import { ShieldProjectData } from '.'

const PROJECT = 'https://contoso.sharepoint.com/sites/skjermet'
const STATUS = '0x010022252E35737A413FB56A1BA53862F6D5'
const ARCHIVE_LOG = '0x0100D9254F0E5237494285C0BB7BEA0A754A'
const TEMPLATE_PROJECT = '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C00A1B2C3D4E5F60718293A4B5C6D7E8F90'

/**
 * Task parameters for the project site. Its properties list holds one item, with the template
 * parameters given; `updates` records what the task writes to it.
 */
function taskParams(parameters: Record<string, string> = {}, storedParameters = '{}') {
  const updates: Record<string, any>[] = []
  const items = {
    select: () => ({
      top: () => () => Promise.resolve([{ Id: 1, TemplateParameters: storedParameters }])
    }),
    getById: () => ({
      update: (properties: Record<string, any>) => {
        updates.push(properties)
        return Promise.resolve()
      }
    })
  }
  const web = { lists: { getByTitle: () => ({ items }) } }
  const params = {
    web,
    webAbsoluteUrl: PROJECT,
    templateSchema: { Parameters: parameters },
    context: {
      pageContext: {
        site: { id: { toString: () => 'site-2' } },
        legacyPageContext: { groupId: 'group-1' }
      }
    }
  } as any
  return { params, updates, web }
}

const shielded = (overrides: Record<string, any> = {}) =>
  ({ isShieldedProject: true, shieldedListGroupNames: ['Porteføljeinnsyn'], ...overrides }) as any

beforeEach(() => {
  service.made = []
  service.lists = []
  service.itemsContentType = []
  service.failOn = undefined
  service.warning = undefined
})

describe('ShieldProjectData', () => {
  it('does nothing for a project that is not shielded', async () => {
    const { params, updates } = taskParams()
    const onProgress = jest.fn()
    expect(await new ShieldProjectData({} as any).execute(params, onProgress)).toBe(params)
    expect(service.made).toEqual([])
    expect(updates).toEqual([])
    expect(onProgress).not.toHaveBeenCalled()
  })

  it("sets up the four lists under the hub lists' titles, from the hub to the project site, the status report list last, since that list is what makes the project shielded", async () => {
    const { params, web } = taskParams({
      ProjectContentTypeId: TEMPLATE_PROJECT,
      ProjectStatusContentTypeId: `${STATUS}00B1B2C3D4E5F60718293A4B5C6D7E8F91`
    })
    await new ShieldProjectData(shielded()).execute(params, jest.fn())
    expect(service.made).toEqual([[HUB_WEB, web, PROJECT]])
    expect(service.lists.map(({ listName, template }) => [listName, template])).toEqual([
      [resource.Lists_ProjectProperties_Title, 100],
      [resource.Lists_ArchiveLog_Title, 100],
      [resource.Lists_ProjectStatusAttachments_Title, 101],
      [resource.Lists_ProjectStatus_Title, 100]
    ])
    // The template's own content types, the hub's for the archive log, none for the library.
    expect(service.lists.map(({ contentTypeId }) => contentTypeId)).toEqual([
      TEMPLATE_PROJECT,
      ARCHIVE_LOG,
      undefined,
      `${STATUS}00B1B2C3D4E5F60718293A4B5C6D7E8F91`
    ])
  })

  it('gives the groups for insight read access to every one of the lists', async () => {
    const { params } = taskParams()
    const groups = ['Porteføljeinnsyn', 'Revisjon']
    await new ShieldProjectData(shielded({ shieldedListGroupNames: groups })).execute(
      params,
      jest.fn()
    )
    expect(service.lists.map(({ readerGroupNames }) => readerGroupNames)).toEqual([
      groups,
      groups,
      groups,
      groups
    ])
  })

  it("uses the hub's status report content type when the template names none, and gives only that list the hub list's own columns", async () => {
    const { params } = taskParams()
    await new ShieldProjectData(shielded()).execute(params, jest.fn())
    const [properties, , , status] = service.lists
    expect(properties.contentTypeId).toBeUndefined()
    expect(status.contentTypeId).toBe(STATUS)
    expect(service.lists.map(({ includeHubListFields }) => !!includeHubListFields)).toEqual([
      false,
      false,
      false,
      true
    ])
    // Without a project content type the properties item is left as it is.
    expect(service.itemsContentType).toEqual([])
  })

  it("gives the properties item the project content type and the site's ID, URL and group, which the hub's entry has for other projects", async () => {
    const { params } = taskParams({ ProjectContentTypeId: TEMPLATE_PROJECT })
    await new ShieldProjectData(shielded()).execute(params, jest.fn())
    expect(service.itemsContentType).toEqual([
      [
        resource.Lists_ProjectProperties_Title,
        `${TEMPLATE_PROJECT}00LISTCOPY`,
        { GtSiteId: 'site-2', GtSiteUrl: PROJECT, GtGroupId: 'group-1' }
      ]
    ])
  })

  it('records in the template parameters that the project is shielded, keeping what they hold, and only once', async () => {
    const first = taskParams({}, '{"ProjectContentTypeId":"0x0100abc"}')
    await new ShieldProjectData(shielded()).execute(first.params, jest.fn())
    expect(first.updates.map(({ TemplateParameters }) => JSON.parse(TemplateParameters))).toEqual([
      { ProjectContentTypeId: '0x0100abc', ShieldedProject: true }
    ])
    const again = taskParams({}, '{"ShieldedProject":true}')
    await new ShieldProjectData(shielded()).execute(again.params, jest.fn())
    expect(again.updates).toEqual([])
  })

  it('stops with the task error when a list cannot be set up, before the status report list is made: the project is not shielded by half a setup', async () => {
    service.failOn = resource.Lists_ArchiveLog_Title
    const { params, updates } = taskParams()
    const error = await new ShieldProjectData(shielded())
      .execute(params, jest.fn())
      .catch((caught) => caught)
    expect(error.message).toBe(strings.ShieldProjectDataErrorMessage)
    // The error is named after its task.
    expect(error.name).toBe('ShieldProjectData')
    expect(service.lists.map(({ listName }) => listName)).toEqual([
      resource.Lists_ProjectProperties_Title
    ])
    expect(updates).toEqual([])
  })

  it('tells of each field it adds while the lists are set up', async () => {
    const { params } = taskParams()
    const onProgress = jest.fn()
    await new ShieldProjectData(shielded()).execute(params, onProgress)
    expect(onProgress).toHaveBeenCalledWith(
      strings.ShieldProjectDataText,
      strings.ShieldProjectDataSubText,
      'LockClosed'
    )
    const [properties] = service.lists
    properties.progressFunc('Fremdrift')
    expect(onProgress).toHaveBeenLastCalledWith(
      strings.ShieldProjectDataText,
      expect.stringContaining('Fremdrift'),
      'LockClosed'
    )
  })

  it("puts what the service goes on without in the advanced log, without the service's prefix", async () => {
    const { params } = taskParams()
    const onProgress = jest.fn()
    service.warning =
      '(ShieldedProjectService) (_ensureFields) Could not add the field [GtStatusTime] to [Prosjektstatus]: Feltet finnes ikke'
    await new ShieldProjectData(shielded()).execute(params, onProgress)
    const logged = onProgress.mock.calls.filter(([, , , entry]) => entry)
    // Once per list: the stand-in warns of the same field each time it is asked for a list.
    expect(logged).toHaveLength(4)
    expect(logged[0]).toEqual([
      strings.ShieldProjectDataText,
      strings.ShieldProjectDataSubText,
      'LockClosed',
      {
        message:
          '(_ensureFields) Could not add the field [GtStatusTime] to [Prosjektstatus]: Feltet finnes ikke',
        level: 'warning'
      }
    ])
  })
})
