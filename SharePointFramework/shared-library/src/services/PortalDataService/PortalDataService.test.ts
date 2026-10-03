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

    it('gives no reports, and takes the hub as out of reach, when access is denied', async () => {
      const { service, queries } = portal({ [LISTS.PROJECT_STATUS]: () => forbidden() })
      expect(await service.getStatusReports({})).toEqual([])
      expect(service.isAvailable).toBe(false)
      expect(await service.getStatusReports({})).toEqual([])
      expect(queries).toHaveLength(1)
    })
  })
})
