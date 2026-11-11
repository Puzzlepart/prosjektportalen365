import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { before, describe, it } from 'node:test'
import type { PortalDataService } from 'pp365-shared-library/lib/services/PortalDataService/index.js'
import { env, ROOT, skipReason } from '../src/env.ts'
import { dataSourceService, portalDataService } from '../src/library.ts'
import type { ISite } from '../src/sites.ts'
import { connect } from '../src/sites.ts'

const require = createRequire(import.meta.url)
const resources = require('SharedResources') as Record<string, string>

/** The matrices' default data sources (`ProjectWebParts/src/webparts/{riskMatrix,opportunityMatrix}`). */
const MATRIX_DATA_SOURCES = {
  risk: 'b0ef3852-230e-4119-8156-5a2ba625e5e1',
  opportunity: 'dc3a4676-a38a-4fa7-a2b3-790f89046b52'
}

/** Prosjektlogg's lookup to the deliveries (`_JsonTemplate{Project,Program}.json`). */
const PROJECT_LOG_PRODUCT = 'GtProjectLogProductLookup'

/**
 * The list a lookup's schema XML points at, as a bare lower-case id, or the attribute as it is.
 *
 * @param schemaXml The field's schema XML
 */
const lookupList = (schemaXml: string): string | undefined =>
  /\sList="([^"]*)"/
    .exec(schemaXml)?.[1]
    .replace(/^\{|\}$/g, '')
    .toLowerCase()

/** Why the tests of the templates' state do not run: the run's upgrade applied no templates. */
const templatesSkip = env.templatesApplied
  ? undefined
  : 'the run applied no templates: INTEGRATION_TEMPLATES_APPLIED is not true (CI sets it after the full upgrade)'

/**
 * What the upgrade leaves on the test hub and the reserved project, read-only: the installation log
 * names the upgrade that just ran, and, after a full upgrade, the templates' state that phase 5
 * changed and verified by hand. The upgrade job has assertions, not only an exit code.
 */
describe("the upgrade's result", { skip: skipReason('hubUrl', 'projectUrl') }, () => {
  let hub: ISite
  let project: ISite
  let portal: PortalDataService

  before(async () => {
    ;[hub, project] = await Promise.all([connect(env.hubUrl!), connect(env.projectUrl!)])
    const { PortalDataService } = portalDataService()
    portal = await new PortalDataService().configure({ spfxContext: hub.context, url: hub.url })
  })

  it('names the upgrade that just ran, with its version, in the installation log', async (t) => {
    // `UpgradeAllSitesToLatest.ps1` logs its own run too, with the installed version unstamped
    // (`1.14.0`). With `[upgrade-all-sites-to-latest]` it runs beside this test, and its entry was
    // the newest (run 41790073082): the upgrade's own entry is the newest one stamped.
    const entries = await hub.sp.web.lists
      .getByTitle(resources.Lists_InstallationLog_Title)
      .items.select('Id', 'InstallVersion', 'InstallChannel')
      .orderBy('Id', false)
      .top(5)<Array<{ InstallVersion: string; InstallChannel: string }>>()
    assert.ok(entries.length > 0, 'the installation log is empty')
    // `Build-Release.ps1` stamps the root package's version and the commit's short hash.
    const { version } = JSON.parse(readFileSync(resolve(ROOT, '..', 'package.json'), 'utf8'))
    const entry = entries.find((e) => e.InstallVersion?.startsWith(`${version}.`))
    assert.ok(
      entry,
      `none of the newest installations is stamped with version ${version}: ${entries.map((e) => e.InstallVersion).join(', ')}`
    )
    if (!env.commit)
      return t.diagnostic(
        `newest stamped installation ${entry.InstallVersion}; no commit to compare`
      )
    const hash = entry.InstallVersion.slice(version.length + 1)
    assert.ok(
      hash.length >= 7 && env.commit.startsWith(hash),
      `the newest stamped installation is ${entry.InstallVersion}, not this run's commit ${env.commit.slice(0, 7)}`
    )
    assert.equal(entry.InstallChannel, 'test')
  })

  it(
    "colours the opportunity status from its own column's configuration",
    { skip: templatesSkip },
    async () => {
      const levels = ['Low', 'Medium', 'High']
      const titles = levels.map(
        (level) =>
          resources[`Lists_ProjectColumnConfiguration_GtStatusOpportunities_${level}_Title`]
      )
      const values = levels.map((level) => resources[`Choice_GtStatusOpportunities_${level}`])
      const rows = await hub.sp.web.lists
        .getByTitle(resources.Lists_ProjectColumnConfiguration_Title)
        .items.select('Id', 'Title', 'GtPortfolioColumnValue', 'GtPortfolioColumn/GtInternalName')
        .expand('GtPortfolioColumn')
        .top(500)<
        Array<{
          Title: string
          GtPortfolioColumnValue: string
          GtPortfolioColumn?: { GtInternalName: string }
        }>
      >()
      const opportunityRows = rows.filter((row) => titles.includes(row.Title))
      // One row per level, on the opportunity status column: the old ones, on another column, are gone.
      assert.deepEqual(
        opportunityRows.map((row) => row.GtPortfolioColumn?.GtInternalName),
        titles.map(() => 'GtStatusOpportunities')
      )
      assert.deepEqual(
        opportunityRows.map((row) => row.GtPortfolioColumnValue).sort(),
        [...values].sort()
      )
      // As the lists read it: a colour for each level on the column.
      const colours = (await portal.getProjectColumnConfig()).filter(
        (row) => row.columnFieldName === 'GtStatusOpportunities'
      )
      assert.deepEqual(colours.map((row) => row.value).sort(), [...values].sort())
      assert.ok(colours.every((row) => row.color))
    }
  )

  it(
    "gives the project's stakeholder register its stakeholder groups field, named in the installation's language",
    { skip: templatesSkip },
    async () => {
      const field = await project.sp.web.lists
        .getByTitle(resources.Lists_Stakeholders_Title)
        .fields.getByInternalNameOrTitle('GtStakeholderGroups')
        .select('Title', 'TypeAsString', 'Group', 'TermSetId')<{
        Title: string
        TypeAsString: string
        Group: string
        TermSetId: string
      }>()
      assert.deepEqual(
        { Title: field.Title, TypeAsString: field.TypeAsString, Group: field.Group },
        {
          Title: resources.SiteFields_GtStakeholderGroups_DisplayName,
          TypeAsString: 'TaxonomyFieldTypeMulti',
          Group: resources.SiteFields_Project_Group
        }
      )
      assert.ok(
        /^[0-9a-f-]{36}$/i.test(field.TermSetId) && !/^0{8}-/.test(field.TermSetId),
        'no term set'
      )
    }
  )

  it(
    "points the program's project log product column at the program's own deliveries",
    { skip: templatesSkip ?? skipReason('programUrl') },
    async (t) => {
      const program = await connect(env.programUrl!)
      const lists = program.sp.web.lists
      const [field] = await lists
        .getByTitle(resources.Lists_ProjectLog_Title)
        .fields.filter(`InternalName eq '${PROJECT_LOG_PRODUCT}'`)
        .select('Title', 'TypeAsString', 'SchemaXml')<
        Array<{ Title: string; TypeAsString: string; SchemaXml: string }>
      >()
      // Programs set up before 1.15.0 have no such column: the template pointed it at
      // Prosjektleveranser, which they lack, and SharePoint refused it. `UpgradeAllSitesToLatest.ps1`
      // adds it, but with `[upgrade-all-sites-to-latest]` it runs beside this test, and may not have
      // reached the program yet.
      if (!field)
        return t.skip(
          `the program's ${resources.Lists_ProjectLog_Title} has no ${PROJECT_LOG_PRODUCT} yet: UpgradeAllSitesToLatest.ps1 adds it`
        )
      const deliveries = await lists
        .getByTitle(resources.Lists_ProgramDeliveries_Title)
        .select('Id')<{ Id: string }>()
      assert.deepEqual(
        {
          Title: field.Title,
          TypeAsString: field.TypeAsString,
          List: lookupList(field.SchemaXml)
        },
        {
          Title: resources.ListFields_ProjectLogProductLookup_DisplayName,
          TypeAsString: 'Lookup',
          List: deliveries.Id.toLowerCase()
        }
      )
    }
  )

  it("finds the matrices' default data sources by their ids", { skip: templatesSkip }, async () => {
    const { DataSourceService } = dataSourceService()
    const dataSources = new DataSourceService(portal.web)
    for (const [matrix, id] of Object.entries(MATRIX_DATA_SOURCES)) {
      const dataSource = await dataSources.getById(id)
      assert.ok(
        dataSource?.searchQuery,
        `the ${matrix} matrix's default data source ${id} is not in the hub`
      )
    }
  })

  it(
    'opens the portfolio overview on a default view whose columns all exist',
    { skip: templatesSkip },
    async () => {
      const [views, columns] = await Promise.all([
        portal.getPortfolioOverviewViews(),
        portal.getProjectColumns()
      ])
      // The overview opens on the first default view, in the views' sort order (`useFetchData`).
      const view = views.find((candidate) => candidate.isDefaultView)
      assert.ok(view, 'the hub has no default portfolio view')
      const missing = view.columnIds.filter((id) => !columns.some((column) => column.id === id))
      assert.deepEqual(
        missing,
        [],
        `the default view ${view.title} names columns that do not exist`
      )
    }
  )
})
