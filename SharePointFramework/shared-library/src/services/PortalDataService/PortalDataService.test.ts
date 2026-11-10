import { PortfolioOverviewView, ProjectColumn } from '../../models'
import { PortalDataService } from './PortalDataService'
import { PortalDataServiceDefaultConfiguration } from './types'

/**
 * The hub's lists through a structural stand-in for `web.lists.getByTitle(...).items`: each
 * query records its calls and answers with `answer(calls)`, or fails with the error it returns.
 */
type Answer = (calls: any[][]) => any
function hubWeb(answers: Record<string, Answer>) {
  const queries: { list: string; calls: any[][] }[] = []
  const query = (list: string) => {
    const calls: any[][] = []
    queries.push({ list, calls })
    const invocable: any = () => {
      const result = answers[list]?.(calls)
      return result instanceof Error ? Promise.reject(result) : Promise.resolve(result ?? [])
    }
    for (const name of ['filter', 'expand', 'orderBy', 'top', 'select', 'using']) {
      invocable[name] = (...args: any[]) => {
        calls.push([name, ...args])
        return invocable
      }
    }
    return invocable
  }
  const web = {
    lists: {
      getByTitle: (title: string) => ({
        get items() {
          return query(title)
        }
      })
    }
  }
  return { web, queries }
}

const LISTS = PortalDataServiceDefaultConfiguration.listNames

function portal(answers: Record<string, Answer>) {
  const { web, queries } = hubWeb(answers)
  const service = new PortalDataService()
  service.web = web as any
  ;(service as any)._configuration = {
    ...PortalDataServiceDefaultConfiguration,
    spfxContext: { pageContext: { site: { id: { toString: () => 'site-1' } } } }
  }
  return { service, queries }
}

const forbidden = () => Object.assign(new Error('403 FORBIDDEN'), { status: 403 })

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
  jest.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => jest.restoreAllMocks())

describe('PortalDataService', () => {
  describe('getGlobalSettings', () => {
    it('reads the enabled settings of the hub', async () => {
      const { service, queries } = portal({
        [LISTS.GLOBAL_SETTINGS]: () => [
          { GtSettingsKey: 'ShowFooter', GtSettingsValue: '1' },
          { GtSettingsKey: 'UseAssistant', GtSettingsValue: '0' }
        ]
      })
      const settings = await service.getGlobalSettings()
      expect(Array.from(settings.entries())).toEqual([
        ['ShowFooter', '1'],
        ['UseAssistant', '0']
      ])
      expect(queries[0].calls).toContainEqual(['filter', 'GtSettingsEnabled eq 1'])
    })

    it('has no settings, and takes the hub as out of reach, when access is denied', async () => {
      const { service } = portal({ [LISTS.GLOBAL_SETTINGS]: () => forbidden() })
      expect((await service.getGlobalSettings()).size).toBe(0)
      expect(service.isAvailable).toBe(false)
      // Out of reach, the hub is not asked again.
      expect((await service.getGlobalSettings()).size).toBe(0)
    })

    it('stays available after an error that is not about access', async () => {
      const { service } = portal({ [LISTS.GLOBAL_SETTINGS]: () => new Error('500 Server Error') })
      expect((await service.getGlobalSettings()).size).toBe(0)
      expect(service.isAvailable).toBe(true)
    })
  })

  describe('addColumnToPortfolioView', () => {
    /**
     * The columns list and the views list: `add` creates column 99, a view item answers with its
     * stored fields, and every write is recorded.
     */
    function viewsService(stored: Record<string, any>) {
      const written: { list: string; id?: number; properties: any }[] = []
      const web = {
        lists: {
          getByTitle: (list: string) => ({
            items: {
              add: (properties: any) => {
                written.push({ list, properties })
                return Promise.resolve({ ...properties, Id: 99 })
              },
              getById: (id: number) => {
                const item: any = () => Promise.resolve(stored)
                item.select = () => item
                item.update = (properties: any) => {
                  written.push({ list, id, properties })
                  return Promise.resolve()
                }
                return item
              }
            }
          })
        }
      }
      const service = new PortalDataService()
      service.web = web as any
      ;(service as any)._configuration = PortalDataServiceDefaultConfiguration
      return { service, written }
    }

    const columns = [1, 2, 3].map(
      (Id) =>
        new ProjectColumn({
          Id,
          GtInternalName: `Kolonne${Id}`,
          GtShowFieldPortfolio: Id !== 2
        } as any)
    )

    it('appends the new column to every column the view holds, those hidden in the portfolio too', async () => {
      const stored = { GtPortfolioColumnsId: [1, 2, 3], GtPortfolioColumnOrder: '[3,1,2]' }
      const { service, written } = viewsService(stored)
      // The view as the overview holds it: column 2 is hidden in the portfolio, so it is not shown.
      const view = new PortfolioOverviewView({ Id: 5, ...stored } as any).configure(columns)
      expect(view.columns.map((column) => column.id)).toEqual([3, 1])
      expect(await service.addColumnToPortfolioView({ Title: 'Ny' } as any, view)).toBe(99)
      expect(written.find(({ list }) => list === LISTS.PORTFOLIO_VIEWS)).toEqual({
        list: LISTS.PORTFOLIO_VIEWS,
        id: 5,
        properties: { GtPortfolioColumnsId: [1, 2, 3, 99], GtPortfolioColumnOrder: '[3,1,2,99]' }
      })
    })

    it('gives a view without an order of its own none', async () => {
      const stored = { GtPortfolioColumnsId: [1], GtPortfolioColumnOrder: null }
      const { service, written } = viewsService(stored)
      const view = new PortfolioOverviewView({ Id: 5, ...stored } as any).configure(columns)
      await service.addColumnToPortfolioView({ Title: 'Ny' } as any, view)
      expect(written.find(({ list }) => list === LISTS.PORTFOLIO_VIEWS)?.properties).toEqual({
        GtPortfolioColumnsId: [1, 99]
      })
    })
  })

  describe('getStatusReports', () => {
    const REPORT = {
      Id: 4,
      Title: 'Statusrapport',
      GtSiteId: 'site-1',
      FieldValuesAsText: { Title: 'Statusrapport', GtOverallStatus: 'Grønn' }
    }

    it("reads the site's reports, newest first, with their texts and attachments", async () => {
      const { service, queries } = portal({ [LISTS.PROJECT_STATUS]: () => [REPORT] })
      const [report] = await service.getStatusReports({ top: 10 })
      expect(report.id).toBe(4)
      expect(queries[0].calls).toEqual([
        ['filter', "GtSiteId eq 'site-1'"],
        ['expand', 'FieldValuesAsText', 'AttachmentFiles'],
        ['orderBy', 'Id', false],
        ['top', 10],
        ['using', expect.anything()]
      ])
    })

    it('adds the people in the user fields from a query of their own', async () => {
      const { service, queries } = portal({
        [LISTS.PROJECT_STATUS]: (calls) =>
          calls.some(([name]) => name === 'orderBy')
            ? [REPORT]
            : [
                {
                  Id: 4,
                  GtStatusOwner: { Id: 12, Title: 'Kari Nordmann', EMail: 'kari@contoso.no' }
                }
              ]
      })
      const [report] = await service.getStatusReports({
        filter: "GtSiteId eq 'site-1' and GtModerationStatus eq 'Publisert'",
        userFields: ['GtStatusOwner'],
        useCaching: false
      })
      expect(queries[1].calls).toEqual([
        ['filter', "GtSiteId eq 'site-1' and GtModerationStatus eq 'Publisert'"],
        ['select', 'Id', 'GtStatusOwner/Id', 'GtStatusOwner/Title', 'GtStatusOwner/EMail'],
        ['expand', 'GtStatusOwner']
      ])
      expect(report.fieldValues.get('GtStatusOwner').value).toEqual({
        Id: 12,
        Title: 'Kari Nordmann',
        EMail: 'kari@contoso.no'
      })
    })

    it('still gives the reports when the people cannot be read', async () => {
      const { service } = portal({
        [LISTS.PROJECT_STATUS]: (calls) =>
          calls.some(([name]) => name === 'orderBy') ? [REPORT] : new Error('400 Bad Request')
      })
      const reports = await service.getStatusReports({ userFields: ['GtStatusOwner'] })
      expect(reports.map(({ id }) => id)).toEqual([4])
    })

    it('gives no reports when access to the list is denied, and keeps the rest of the hub', async () => {
      const { service, queries } = portal({ [LISTS.PROJECT_STATUS]: () => forbidden() })
      expect(await service.getStatusReports({})).toEqual([])
      expect(service.isListAvailable('PROJECT_STATUS')).toBe(false)
      expect(service.isAvailable).toBe(true)
      // The denied list is not asked again.
      expect(await service.getStatusReports({})).toEqual([])
      expect(queries).toHaveLength(1)
    })
  })

  describe('a member of «Minimum lesetilganger på hub»', () => {
    // The group reads the configuration lists, but not the lists with data about all projects.
    const answers = {
      [LISTS.GLOBAL_SETTINGS]: () => [{ GtSettingsKey: 'ShowFooter', GtSettingsValue: '1' }],
      [LISTS.PROJECT_COLUMNS]: () => [{ Id: 1, GtInternalName: 'GtProjectManager' }],
      [LISTS.PROJECT_ADMIN_ROLES]: () => [{ Id: 1, Title: 'Prosjektleder' }],
      [LISTS.PROJECT_STATUS]: () => forbidden(),
      [LISTS.PROJECTS]: () => forbidden()
    }

    it('reads the configuration after the lists with data about all projects were denied', async () => {
      const { service } = portal(answers)
      expect(await service.getStatusReports({})).toEqual([])
      expect(await service.getProjectDetails()).toBeNull()
      expect(service.isAvailable).toBe(true)
      expect((await service.getGlobalSettings()).get('ShowFooter')).toBe('1')
      expect((await service.getProjectColumns()).map((column) => column.internalName)).toEqual([
        'GtProjectManager'
      ])
      expect((await service.getProjectAdminRoles()).map((role) => role.title)).toEqual([
        'Prosjektleder'
      ])
    })

    it('marks only the denied lists', async () => {
      const { service } = portal(answers)
      await service.getStatusReports({})
      await service.getProjectDetails()
      expect(service.isListAvailable('PROJECT_STATUS')).toBe(false)
      expect(service.isListAvailable('PROJECTS')).toBe(false)
      expect(service.isListAvailable('PROJECT_COLUMNS')).toBe(true)
      expect(service.isListAvailable('GLOBAL_SETTINGS')).toBe(true)
    })
  })

  describe('a user without access to the hub', () => {
    it('takes the hub as out of reach when `Globale innstillinger` is denied', async () => {
      const { service, queries } = portal({
        [LISTS.GLOBAL_SETTINGS]: () => forbidden(),
        [LISTS.PROJECT_COLUMNS]: () => [{ Id: 1, GtInternalName: 'GtProjectManager' }]
      })
      await service.getGlobalSettings()
      expect(service.isAvailable).toBe(false)
      expect(service.isListAvailable('PROJECT_COLUMNS')).toBe(false)
      // The other lists are not asked once the hub is out of reach.
      expect(await service.getProjectColumns()).toEqual([])
      expect(queries.map(({ list }) => list)).toEqual([LISTS.GLOBAL_SETTINGS])
    })
  })

  describe('a shielded project', () => {
    /**
     * A project site that keeps its project data in its own lists, beside the hub: `local` answers
     * for the project site, `hub` for the hub.
     */
    function shielded(
      state: 'shielded' | 'unresolved',
      local: Record<string, Answer>,
      hub: Record<string, Answer> = {}
    ) {
      const project = hubWeb(local)
      const { service, queries } = portal(hub)
      ;(service as any)._sp = { web: project.web }
      service.shieldedProjectState = state
      return { service, hubQueries: queries, projectQueries: project.queries }
    }

    it('reads its status reports on the project site, also when the hub is out of reach', async () => {
      const { service, hubQueries, projectQueries } = shielded('shielded', {
        [LISTS.PROJECT_STATUS]: () => [{ Id: 7, GtSiteId: 'site-1', FieldValuesAsText: {} }]
      })
      service.isAvailable = false
      const reports = await service.getStatusReports({})
      expect(reports.map(({ id }) => id)).toEqual([7])
      expect(projectQueries.map(({ list }) => list)).toEqual([LISTS.PROJECT_STATUS])
      expect(hubQueries).toHaveLength(0)
    })

    it('keeps the hub available when its own list denies access', async () => {
      const { service } = shielded('shielded', { [LISTS.PROJECT_STATUS]: () => forbidden() })
      expect(await service.getStatusReports({})).toEqual([])
      expect(service.isAvailable).toBe(true)
      expect(service.isListAvailable('PROJECT_STATUS')).toBe(true)
    })

    it('reads the configuration on the hub', async () => {
      const { service, projectQueries } = shielded(
        'shielded',
        {},
        { [LISTS.PROJECT_COLUMNS]: () => [{ Id: 1, GtInternalName: 'GtProjectManager' }] }
      )
      expect((await service.getProjectColumns()).map((column) => column.internalName)).toEqual([
        'GtProjectManager'
      ])
      expect(projectQueries).toHaveLength(0)
    })

    it('never writes to the hub lists with data about every project', async () => {
      const { service } = shielded('shielded', {})
      await expect(service.addItemToList('PROJECTS', { Title: 'Prosjekt' })).rejects.toThrow(
        LISTS.PROJECTS
      )
      await expect(service.updateItemInList('TIMELINE_CONTENT', 1, {})).rejects.toThrow(
        LISTS.TIMELINE_CONTENT
      )
      await expect(service.deleteItemFromList('TIMELINE_CONTENT', 1)).rejects.toThrow(
        LISTS.TIMELINE_CONTENT
      )
    })

    it('neither reads nor writes project data while it is unresolved', async () => {
      const { service, hubQueries, projectQueries } = shielded('unresolved', {
        [LISTS.PROJECT_STATUS]: () => [{ Id: 7, FieldValuesAsText: {} }]
      })
      expect(service.isShieldedProject).toBe(true)
      expect(service.isListAvailable('PROJECT_STATUS')).toBe(false)
      expect(await service.getStatusReports({})).toEqual([])
      await expect(service.deleteStatusReport(7)).rejects.toThrow()
      expect(() => service.getProjectDataWeb()).toThrow()
      expect(hubQueries).toHaveLength(0)
      expect(projectQueries).toHaveLength(0)
    })
  })

  describe('whether the project is shielded', () => {
    /**
     * Settles the state for a site with the given hub, whose lists answer `lists`.
     */
    async function resolve(
      legacyPageContext: { siteId?: string; hubSiteId?: string },
      lists: () => any[] | Error,
      url?: string
    ) {
      const service = new PortalDataService()
      const filters: string[] = []
      ;(service as any)._configuration = {
        ...PortalDataServiceDefaultConfiguration,
        url,
        spfxContext: { pageContext: { legacyPageContext } }
      }
      ;(service as any)._sp = {
        web: {
          lists: {
            filter: (filter: string) => {
              filters.push(filter)
              return {
                select: () => () => {
                  const result = lists()
                  return result instanceof Error ? Promise.reject(result) : Promise.resolve(result)
                }
              }
            }
          }
        }
      }
      await (service as any)._resolveShieldedProject()
      return { state: service.shieldedProjectState, filters }
    }
    const PROJECT = { siteId: '{11111111-aaaa}', hubSiteId: '22222222-bbbb' }

    it('is shielded when the project site has its own list for status reports', async () => {
      const { state, filters } = await resolve(PROJECT, () => [{ Id: 'list-1' }])
      expect(state).toBe('shielded')
      expect(filters).toEqual([`Title eq '${LISTS.PROJECT_STATUS}'`])
    })

    it('is not shielded without that list', async () => {
      expect((await resolve(PROJECT, () => [])).state).toBe('none')
    })

    it('is unresolved when the lists cannot be read', async () => {
      expect((await resolve(PROJECT, () => new Error('500'))).state).toBe('unresolved')
    })

    it('is never shielded on the hub, outside a hub, or for another portfolio', async () => {
      const hub = { siteId: '{22222222-BBBB}', hubSiteId: '22222222-bbbb' }
      expect((await resolve(hub, () => [{ Id: 'list-1' }])).state).toBe('none')
      expect((await resolve({ siteId: '{1}' }, () => [{ Id: 'list-1' }])).state).toBe('none')
      expect(
        (await resolve(PROJECT, () => [{ Id: 'list-1' }], 'https://contoso/sites/pp')).state
      ).toBe('none')
    })
  })
})
