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

  describe('the check of hub access when configured', () => {
    /** A service configured against `url`, its probe run as `configure` runs it. */
    async function probed(url: string, answers: Record<string, Answer>) {
      const { service, queries } = portal(answers)
      service.url = url
      await (service as any)._probeHubAccess()
      return { service, queries }
    }

    it('asks the hub once per page load, without the cache the settings use', async () => {
      const url = 'https://contoso.sharepoint.com/sites/probe-once'
      const first = await probed(url, { [LISTS.GLOBAL_SETTINGS]: () => [{ Id: 1 }] })
      const second = await probed(url, { [LISTS.GLOBAL_SETTINGS]: () => [{ Id: 1 }] })
      expect(first.service.isAvailable).toBe(true)
      expect(second.service.isAvailable).toBe(true)
      expect(first.queries[0].calls).toEqual([
        ['select', 'Id'],
        ['top', 1]
      ])
      // The second instance on the page takes the first one's answer.
      expect(second.queries).toHaveLength(0)
    })

    it('takes the hub as out of reach when `Globale innstillinger` is denied', async () => {
      const { service } = await probed('https://contoso.sharepoint.com/sites/probe-denied', {
        [LISTS.GLOBAL_SETTINGS]: () => forbidden()
      })
      expect(service.isAvailable).toBe(false)
    })

    it('keeps the hub after an error that is not about access', async () => {
      const { service } = await probed('https://contoso.sharepoint.com/sites/probe-error', {
        [LISTS.GLOBAL_SETTINGS]: () => new Error('500 Server Error')
      })
      expect(service.isAvailable).toBe(true)
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

  describe('deleteItemFromList', () => {
    /** A list whose item records what was done to it, and fails with `error` when given one. */
    function listService(error?: Error) {
      const calls: string[] = []
      const answer = (name: string) => {
        calls.push(name)
        return error ? Promise.reject(error) : Promise.resolve()
      }
      const web = {
        lists: {
          getByTitle: (list: string) => ({
            items: {
              getById: (id: number) => {
                calls.push(`${list} ${id}`)
                return { recycle: () => answer('recycle'), delete: () => answer('delete') }
              }
            }
          })
        }
      }
      const service = new PortalDataService()
      service.web = web as any
      ;(service as any)._configuration = PortalDataServiceDefaultConfiguration
      return { service, calls }
    }

    it('moves the item to the recycle bin, where it can be restored, rather than deleting it for good', async () => {
      // The column forms deleted the locked project column for good (1.15 smoke test).
      const { service, calls } = listService()
      expect(await service.deleteItemFromList('PROJECT_CONTENT_COLUMNS', 36)).toBe(true)
      expect(calls).toEqual([`${LISTS.PROJECT_CONTENT_COLUMNS} 36`, 'recycle'])
    })

    it('says so when the item cannot be removed', async () => {
      const { service } = listService(forbidden())
      expect(await service.deleteItemFromList('PROJECT_CONTENT_COLUMNS', 36)).toBe(false)
    })
  })
})
