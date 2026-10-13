import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { before, describe, it } from 'node:test'
import type { ISearchAggregatedItemsOptions } from 'pp365-shared-library/lib/data/searchAggregatedItems.js'
import type { DataSource } from 'pp365-shared-library/lib/models/index.js'
import { env, skipReason } from '../src/env.ts'
import { aggregatedSearch, dataSourceService, portalDataService } from '../src/library.ts'
import type { ISite } from '../src/sites.ts'
import { connect } from '../src/sites.ts'

/** The risk matrix's default data source (`ProjectWebParts/src/webparts/riskMatrix/index.ts`). */
const RISK_MATRIX_DATA_SOURCE = 'b0ef3852-230e-4119-8156-5a2ba625e5e1'

/** What the risk matrix selects besides the data source's columns (`baseUncertaintyMatrixWebPart`). */
const MATRIX_PROPERTIES = [
  'ListItemID',
  'GtRiskStrategyOWSCHCS',
  'GtRiskProximityOWSCHCS',
  'GtRiskStatusOWSCHCS',
  'GtShowInPortfolioOWSBOOL',
  'SiteId'
]

/** A site id as the risk matrix compares them: without braces, in lower case. */
const normalizeSiteId = (siteId: unknown) =>
  String(siteId ?? '')
    .replace(/[{}]/g, '')
    .toLowerCase()

/** The results' paths, sorted: the same results whatever order the requests answered in. */
const paths = (items: Record<string, any>[]) => items.map((item) => String(item.Path)).sort()

/** A child project as `PortalDataService.getChildProjects` builds it, keeping only its site id. */
class ChildProject {
  siteId: string
  constructor(item: { GtSiteId: string }) {
    this.siteId = item.GtSiteId
  }
}

/**
 * `searchAggregatedItems`, which the program's and the project's aggregating web parts fetch with,
 * over the test program's projects with the risk matrix's default data source. Pins what phase 5
 * verified by hand: what search returns, in which forms, and that chunking and paging lose nothing.
 */
describe(
  'aggregated search over the test program',
  { skip: skipReason('hubUrl', 'programUrl') },
  () => {
    let program: ISite
    let siteIds: string[]
    let dataSource: DataSource
    let search: (options?: Partial<ISearchAggregatedItemsOptions>) => Promise<Record<string, any>[]>

    before(async () => {
      const hub = await connect(env.hubUrl!)
      program = await connect(env.programUrl!)
      const { PortalDataService } = portalDataService()
      const portal = await new PortalDataService().configure({
        spfxContext: hub.context,
        url: hub.url
      })
      const children = await portal.getChildProjects(
        program.context.pageContext.web.absoluteUrl,
        ChildProject
      )
      siteIds = children.map((child) => child.siteId)
      const { DataSourceService } = dataSourceService()
      dataSource = await new DataSourceService(portal.web).getById(RISK_MATRIX_DATA_SOURCE)
      assert.ok(
        dataSource,
        `the hub has no data source ${RISK_MATRIX_DATA_SOURCE} (the risk matrix's)`
      )
      const { searchAggregatedItems } = aggregatedSearch()
      search = (options = {}) =>
        searchAggregatedItems(program.sp, {
          siteIds,
          queryTemplate: dataSource.searchQuery,
          selectProperties: ['SiteId'],
          ...options
        })
    })

    it('returns every property the risk matrix selects, in the forms its filter reads', async (t) => {
      const selectProperties = [
        ...MATRIX_PROPERTIES,
        ...dataSource.columns.map((column) => column.fieldName).filter(Boolean)
      ]
      const selfSiteId = program.context.pageContext.site.id.toString()
      const items = await search({ selectProperties, includeSelf: true, selfSiteId })
      assert.ok(items.length > 0, "the test program's projects have no risks: the test needs some")
      for (const key of selectProperties) {
        assert.ok(
          items.every((item) => Object.hasOwn(item, key)),
          `${key} is missing from a result`
        )
      }
      // Numbers come as text ("3.00000000000000"), which the lists' sorting reads itself.
      const numbers = items
        .flatMap((item) =>
          selectProperties.filter((key) => key.endsWith('OWSNMBR')).map((key) => item[key])
        )
        .filter((value) => value !== null)
      assert.ok(numbers.length > 0, 'no number among the results')
      assert.ok(
        numbers.every((value) => typeof value === 'string' && Number.isFinite(Number(value)))
      )
      // The "show in portfolio" flag, which the matrix's filter compares with '1' and 'true'.
      const flags = new Set(items.map((item) => item.GtShowInPortfolioOWSBOOL))
      for (const flag of flags) {
        assert.ok(
          flag === null || ['0', '1', 'true', 'false'].includes(String(flag).toLowerCase()),
          `GtShowInPortfolioOWSBOOL came as ${JSON.stringify(flag)}`
        )
      }
      // Every result names a site that was searched, compared as the matrix compares site ids.
      const searched = new Set([...siteIds, selfSiteId].map(normalizeSiteId))
      assert.ok(items.every((item) => searched.has(normalizeSiteId(item.SiteId))))
      t.diagnostic(
        `${items.length} results from ${siteIds.length} projects; SiteId as ${items[0].SiteId}`
      )
    })

    it('pages past the row limit to the same results', async () => {
      const all = await search()
      assert.ok(all.length > 7, 'too few results to page through')
      assert.deepEqual(paths(await search({ rowLimit: 7 })), paths(all))
    })

    it('splits many sites over several requests and loses none of their results', async () => {
      // Site ids that match no site, ahead of the real ones, push the query past one request.
      const padded = [...Array.from({ length: 40 }, () => randomUUID()), ...siteIds]
      const { buildAggregatedSiteIdQueries } = aggregatedSearch()
      assert.ok(
        buildAggregatedSiteIdQueries(padded, 'SiteId').length > 1,
        'the sites fit one request'
      )
      assert.deepEqual(paths(await search({ siteIds: padded })), paths(await search()))
    })

    it("adds the current site's own results with includeSelf", async () => {
      // The program has no risks of its own, so the project with the most stands in for it.
      const counts = new Map<string, number>()
      for (const item of await search()) {
        const siteId = normalizeSiteId(item.SiteId)
        counts.set(siteId, (counts.get(siteId) ?? 0) + 1)
      }
      const [self, count] = [...counts].sort((a, b) => b[1] - a[1])[0]
      const own = await search({ siteIds: [], includeSelf: true, selfSiteId: self })
      assert.equal(own.length, count)
      assert.ok(own.every((item) => normalizeSiteId(item.SiteId) === self))
    })
  }
)
