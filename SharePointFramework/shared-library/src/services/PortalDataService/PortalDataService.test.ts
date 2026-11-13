import { PortfolioOverviewView, ProjectColumn } from '../../models'
import { errorCodeFrom } from '../../telemetry/errorCode'
import { TelemetryHeartbeatInput } from '../../telemetry/validate'
import { errorWithStatus } from '../../util/errorWithStatus'
import { PortalDataService } from './PortalDataService'
import { PortalDataServiceDefaultConfiguration } from './types'

/**
 * The hub's lists through a structural stand-in for `web.lists.getByTitle(...).items`, and for
 * the list itself (`getByTitle(...).select(...)`): each query records its calls and answers with
 * `answer(calls)`, or fails with the error it returns.
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
        },
        select: (...fields: string[]) => query(title).select(...fields)
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

    /** A service on the site `siteId` of the hub `hubSiteId`, settling its access as `configure` does. */
    async function settled(url: string, siteId: string, hubSiteId: string) {
      const { service, queries } = portal({ [LISTS.GLOBAL_SETTINGS]: () => forbidden() })
      service.url = url
      ;(service as any)._configuration.spfxContext.pageContext.legacyPageContext = {
        siteId,
        hubSiteId
      }
      await (service as any)._settleHubAccess()
      return { service, queries }
    }

    it('does not ask on the hub itself, where a group may read the hub but not the settings', async () => {
      // A customer's own group with access to the hub kept the portfolio overview's columns in
      // 1.14, which never read `Globale innstillinger` on the hub.
      const hub = 'a1b2c3d4-0000-4000-8000-000000000001'
      const { service, queries } = await settled(
        'https://contoso.sharepoint.com/sites/probe-on-hub',
        `{${hub}}`,
        hub
      )
      expect(queries).toHaveLength(0)
      expect(service.isAvailable).toBe(true)
    })

    it('asks from a project site of the hub', async () => {
      const { service, queries } = await settled(
        'https://contoso.sharepoint.com/sites/probe-from-project',
        '{a1b2c3d4-0000-4000-8000-000000000002}',
        'a1b2c3d4-0000-4000-8000-000000000001'
      )
      expect(queries.map(({ list }) => list)).toEqual([LISTS.GLOBAL_SETTINGS])
      expect(service.isAvailable).toBe(false)
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

  describe('the status that took the hub out of reach', () => {
    it('has none while the hub is in reach', async () => {
      const { service } = portal({
        [LISTS.GLOBAL_SETTINGS]: () => [{ GtSettingsKey: 'ShowFooter', GtSettingsValue: '1' }],
        [LISTS.PROJECT_STATUS]: () => forbidden()
      })
      await service.getGlobalSettings()
      // A list that denies access is not the hub: the hub stays in reach, and has no status.
      await service.getStatusReports({})
      expect(service.isAvailable).toBe(true)
      expect(service.unavailableStatus).toBeUndefined()
    })

    it.each([[401], [403]])(
      'keeps the %i `Globale innstillinger` was denied with, for the error a web part throws',
      async (status) => {
        const denied = Object.assign(new Error(`[${status}]`), { status })
        const { service } = portal({ [LISTS.GLOBAL_SETTINGS]: () => denied })
        await service.getGlobalSettings()
        expect(service.isAvailable).toBe(false)
        expect(service.unavailableStatus).toBe(status)
        // What a web part makes of it: its own text, counted as the denied permission it was.
        const error = errorWithStatus(
          'Du har ikke tilgang til porteføljen.',
          service.unavailableStatus
        )
        expect(errorCodeFrom(error)).toBe('permission_denied')
      }
    )

    it('keeps the status the check of hub access was denied with, for every instance on the page', async () => {
      const url = 'https://contoso.sharepoint.com/sites/probe-status'
      const first = portal({ [LISTS.GLOBAL_SETTINGS]: () => forbidden() })
      const second = portal({ [LISTS.GLOBAL_SETTINGS]: () => [{ Id: 1 }] })
      for (const { service } of [first, second]) {
        service.url = url
        await (service as any)._probeHubAccess()
        expect(service.isAvailable).toBe(false)
        expect(service.unavailableStatus).toBe(403)
      }
      // The second instance took the first one's answer, status included.
      expect(second.queries).toHaveLength(0)
    })

    it('has none when the refusal came without a status, or nothing refused at all', async () => {
      // SharePoint's own words for a refusal, in an error that carries no status.
      const { service } = portal({
        [LISTS.GLOBAL_SETTINGS]: () => new Error('Attempted to perform an unauthorized operation.')
      })
      await service.getGlobalSettings()
      expect(service.isAvailable).toBe(false)
      expect(service.unavailableStatus).toBeUndefined()
      expect(
        errorCodeFrom(errorWithStatus('Du har ikke tilgang.', service.unavailableStatus))
      ).toBe('unknown')

      // A hub whose URL was never found: no request was refused.
      const unresolved = portal({}).service
      ;(unresolved as any)._markUnavailable()
      expect(unresolved.isAvailable).toBe(false)
      expect(unresolved.unavailableStatus).toBeUndefined()
    })

    it('keeps the first status: a hub out of reach is not asked again', async () => {
      const { service, queries } = portal({ [LISTS.GLOBAL_SETTINGS]: () => forbidden() })
      await service.getGlobalSettings()
      await service.getGlobalSettings()
      await service.getProjectColumns()
      expect(service.unavailableStatus).toBe(403)
      expect(queries).toHaveLength(1)
    })
  })

  describe('the reads of usage statistics', () => {
    const INSTALLATION = { InstallVersion: '1.15.0.a1b2c3d', InstallChannel: 'test' }

    /** How Prosjekter answers each read of the snapshot, or the read of a site's flags. */
    function projects(
      answers: { count?: any; programs?: any; parentProjects?: any; flags?: any } = {}
    ): Answer {
      const { count = { ItemCount: 412 }, programs = [{ Id: 3 }, { Id: 8 }, { Id: 21 }] } = answers
      const { parentProjects = [{ Id: 5 }, { Id: 13 }], flags = [] } = answers
      return (calls) => {
        const filter: string = calls.find(([name]) => name === 'filter')?.[1] ?? ''
        if (filter.startsWith('GtIsProgram')) return programs
        if (filter.startsWith('GtIsParentProject')) return parentProjects
        return filter.startsWith('GtSiteId') ? flags : count
      }
    }

    describe('getUsageSnapshot', () => {
      it("reads the newest installation's channel and version and the hub's counts, and nothing else", async () => {
        const { service, queries } = portal({
          [LISTS.INSTALLATION_LOG]: () => [INSTALLATION],
          [LISTS.PROJECTS]: projects()
        })
        expect(await service.getUsageSnapshot()).toEqual({
          channel: 'test',
          templateVersion: '1.15.0',
          projects: 412,
          programs: 3,
          parentProjects: 2
        })
        expect(queries).toEqual([
          {
            list: LISTS.INSTALLATION_LOG,
            calls: [
              ['select', 'InstallVersion', 'InstallChannel'],
              ['orderBy', 'InstallStartTime', false],
              ['top', 1]
            ]
          },
          { list: LISTS.PROJECTS, calls: [['select', 'ItemCount']] },
          {
            list: LISTS.PROJECTS,
            calls: [
              ['select', 'Id'],
              ['filter', 'GtIsProgram eq 1'],
              ['top', 5000]
            ]
          },
          {
            list: LISTS.PROJECTS,
            calls: [
              ['select', 'Id'],
              ['filter', 'GtIsParentProject eq 1'],
              ['top', 5000]
            ]
          }
        ])
      })

      it('is not cached: no read uses a cache, and each call reads the hub again', async () => {
        const { service, queries } = portal({
          [LISTS.INSTALLATION_LOG]: () => [INSTALLATION],
          [LISTS.PROJECTS]: projects()
        })
        await service.getUsageSnapshot()
        await service.getUsageSnapshot()
        expect(queries).toHaveLength(8)
        const called = queries.flatMap(({ calls }) => calls.map(([name]) => name))
        expect(called).not.toContain('using')
      })

      it('fits a heartbeat as it is, with the language of the hub the page knows', async () => {
        const { service } = portal({
          [LISTS.INSTALLATION_LOG]: () => [{ InstallVersion: '1.15.0', InstallChannel: 'main' }],
          [LISTS.PROJECTS]: projects()
        })
        // The compiler checks the shape: the Footer could queue it with nothing but the language.
        const heartbeat: TelemetryHeartbeatInput = {
          ...(await service.getUsageSnapshot()),
          hubLanguage: 'nb-NO'
        }
        expect(Object.keys(heartbeat).sort()).toEqual([
          'channel',
          'hubLanguage',
          'parentProjects',
          'programs',
          'projects',
          'templateVersion'
        ])
      })

      it('leaves out what a read could not get, and still gives the rest', async () => {
        // A hub beyond the list view threshold: the count of programs fails, the others answer.
        const threshold = Object.assign(new Error('[500] exceeds the list view threshold'), {
          status: 500
        })
        const { service } = portal({
          [LISTS.INSTALLATION_LOG]: () => [INSTALLATION],
          [LISTS.PROJECTS]: projects({ programs: threshold })
        })
        expect(await service.getUsageSnapshot()).toEqual({
          channel: 'test',
          templateVersion: '1.15.0',
          projects: 412,
          parentProjects: 2
        })

        const notFound = Object.assign(new Error('[404] List does not exist'), { status: 404 })
        const withoutLog = portal({
          [LISTS.INSTALLATION_LOG]: () => notFound,
          [LISTS.PROJECTS]: projects({ count: forbidden(), parentProjects: [] })
        })
        expect(await withoutLog.service.getUsageSnapshot()).toEqual({
          channel: 'unknown',
          programs: 3,
          parentProjects: 0
        })
        // A read for usage statistics marks nothing: the app's own reads still ask the lists.
        expect(withoutLog.service.isAvailable).toBe(true)
        expect(withoutLog.service.isListAvailable('PROJECTS')).toBe(true)
        expect(withoutLog.service.isListAvailable('INSTALLATION_LOG')).toBe(true)
      })

      it('takes a hub without an installation row, or with values it does not know, as it is', async () => {
        const { service } = portal({
          [LISTS.INSTALLATION_LOG]: () => [],
          [LISTS.PROJECTS]: projects({ count: {}, programs: [], parentProjects: [] })
        })
        expect(await service.getUsageSnapshot()).toEqual({
          channel: 'unknown',
          programs: 0,
          parentProjects: 0
        })

        const odd = portal({
          [LISTS.INSTALLATION_LOG]: () => [{ InstallVersion: 'dev', InstallChannel: 'kunde-x' }],
          [LISTS.PROJECTS]: projects({ count: { ItemCount: 100001 } })
        })
        expect(await odd.service.getUsageSnapshot()).toEqual({
          channel: 'unknown',
          programs: 3,
          parentProjects: 2
        })
      })

      it('gives nothing, and asks nothing, when the hub is out of reach', async () => {
        const { service, queries } = portal({ [LISTS.GLOBAL_SETTINGS]: () => forbidden() })
        await service.getGlobalSettings()
        expect(await service.getUsageSnapshot()).toBeNull()
        expect(queries.map(({ list }) => list)).toEqual([LISTS.GLOBAL_SETTINGS])
      })

      it('does not ask a list that has denied the user access', async () => {
        const { service, queries } = portal({
          [LISTS.INSTALLATION_LOG]: () => [INSTALLATION],
          [LISTS.PROJECTS]: () => forbidden()
        })
        expect(await service.getProjectDetails()).toBeNull()
        expect(await service.getUsageSnapshot()).toEqual({
          channel: 'test',
          templateVersion: '1.15.0'
        })
        expect(queries.map(({ list }) => list)).toEqual([LISTS.PROJECTS, LISTS.INSTALLATION_LOG])
      })
    })

    describe('getSiteKind', () => {
      const SITE_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

      it.each([
        [{ GtIsProgram: true, GtIsParentProject: true }, 'program'],
        [{ GtIsProgram: true, GtIsParentProject: false }, 'program'],
        [{ GtIsProgram: false, GtIsParentProject: true }, 'parent'],
        [{ GtIsProgram: false, GtIsParentProject: false }, 'project'],
        [{ GtIsProgram: null, GtIsParentProject: null }, 'project']
      ])("reads the site's row in Prosjekter: %p is a %s", async (flags, siteType) => {
        const { service, queries } = portal({ [LISTS.PROJECTS]: projects({ flags: [flags] }) })
        expect(await service.getSiteKind(SITE_ID)).toBe(siteType)
        expect(queries).toEqual([
          {
            list: LISTS.PROJECTS,
            calls: [
              ['select', 'GtIsProgram', 'GtIsParentProject'],
              ['filter', `GtSiteId eq '${SITE_ID}'`],
              ['top', 1]
            ]
          }
        ])
      })

      it('takes a site without a row for something else than a project of the hub', async () => {
        const { service } = portal({ [LISTS.PROJECTS]: projects({ flags: [] }) })
        expect(await service.getSiteKind(SITE_ID)).toBe('other')
      })

      it('finds the row by the id as SharePoint stores it, and asks nothing for a value that is no id', async () => {
        const { service, queries } = portal({
          [LISTS.PROJECTS]: projects({ flags: [{ GtIsProgram: true }] })
        })
        expect(await service.getSiteKind(`{${SITE_ID.toUpperCase()}}`)).toBe('program')
        expect(queries[0].calls).toContainEqual(['filter', `GtSiteId eq '${SITE_ID}'`])

        for (const value of ["x' or GtSiteId ne '", 'site-1', '', undefined, null]) {
          expect(await service.getSiteKind(value)).toBe('other')
        }
        expect(queries).toHaveLength(1)
      })

      it('is not cached: it uses no cache, and reads the hub each time it is asked', async () => {
        const { service, queries } = portal({ [LISTS.PROJECTS]: projects({ flags: [{}] }) })
        await service.getSiteKind(SITE_ID)
        await service.getSiteKind(SITE_ID)
        expect(queries).toHaveLength(2)
        expect(queries.flatMap(({ calls }) => calls.map(([name]) => name))).not.toContain('using')
      })

      it('answers other when the row cannot be read, and keeps the list', async () => {
        const { service, queries } = portal({
          [LISTS.PROJECTS]: () => Object.assign(new Error('[503]'), { status: 503 })
        })
        expect(await service.getSiteKind(SITE_ID)).toBe('other')
        expect(service.isListAvailable('PROJECTS')).toBe(true)
        expect(await service.getSiteKind(SITE_ID)).toBe('other')
        expect(queries).toHaveLength(2)
      })

      it('answers other when the list is denied, and does not ask it again', async () => {
        // A member of «Minimum lesetilganger på hub» may not read the list of all projects.
        const { service, queries } = portal({ [LISTS.PROJECTS]: () => forbidden() })
        expect(await service.getSiteKind(SITE_ID)).toBe('other')
        expect(service.isListAvailable('PROJECTS')).toBe(false)
        expect(service.isAvailable).toBe(true)
        expect(await service.getSiteKind(SITE_ID)).toBe('other')
        expect(await service.getProjectDetails()).toBeNull()
        expect(queries).toHaveLength(1)
      })

      it('answers other, and asks nothing, when the hub is out of reach', async () => {
        const { service, queries } = portal({
          [LISTS.GLOBAL_SETTINGS]: () => forbidden(),
          [LISTS.PROJECTS]: projects({ flags: [{ GtIsProgram: true }] })
        })
        await service.getGlobalSettings()
        expect(await service.getSiteKind(SITE_ID)).toBe('other')
        expect(queries.map(({ list }) => list)).toEqual([LISTS.GLOBAL_SETTINGS])
      })

      it('answers other when the hub web cannot be asked at all', async () => {
        const { service } = portal({})
        service.web = undefined
        expect(await service.getSiteKind(SITE_ID)).toBe('other')
        expect(await service.getUsageSnapshot()).toEqual({ channel: 'unknown' })
      })
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
