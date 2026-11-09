import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { describe, it } from 'node:test'
import { env, skipReason } from '../src/env.ts'
import { projectWebPartsAdapter } from '../src/library.ts'
import type { ISite } from '../src/sites.ts'
import { connect } from '../src/sites.ts'

const require = createRequire(import.meta.url)
const resources = require('SharedResources') as Record<string, string>
/** ProjectWebParts' own strings, through the loader as the solution's modules read them. */
const strings = require('ProjectWebPartsStrings') as Record<string, string>

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

/** A site id as the matrix compares them: without braces, in lower case. */
const normalizeSiteId = (siteId: unknown) =>
  String(siteId ?? '')
    .replace(/[{}]/g, '')
    .toLowerCase()

/** ProjectWebParts' adapter, configured with a site's context as the web parts on it configure it. */
async function adapterFor(site: ISite) {
  const adapter = projectWebPartsAdapter()
  await adapter.configure(site.context, {
    siteId: site.context.pageContext.site.id.toString(),
    webUrl: site.url
  })
  return adapter
}

/**
 * ProjectWebParts' data adapter (`SPDataAdapter`, slice 5) from the solution's CommonJS build, as
 * its web parts use it: saving project information syncs the project's properties to its row in
 * the hub, and the risk matrix on a program fetches its children's risks through its data source.
 * The library's parts of both are tested on their own; these run the solution's code over them.
 */
describe(
  "ProjectWebParts' data adapter, as its web parts use it",
  { skip: skipReason('hubUrl', 'projectUrl') },
  () => {
    it("syncs the project's properties to its row in the hub, as saving project information does", async () => {
      const project = await connect(env.projectUrl!)
      const adapter = await adapterFor(project)
      const siteId = project.context.pageContext.site.id.toString()
      const title = project.context.pageContext.web.title
      const original = await adapter.project.getProjectInformationData()
      const originalName = original.fieldValues?.get('GtProjectFinanceName')?.value ?? null
      const rowBefore = await adapter.entityService.getEntityItem(siteId)
      const progress: string[] = []
      /** Syncs as saving project information does, from what the save returned. */
      const sync = async (data: typeof original | null) => {
        assert.ok(data?.fieldValues, 'the save returned no project information')
        await adapter.syncPropertyItemToHub(
          title,
          data.fieldValues,
          data.templateParameters ?? {},
          ({ label }) => progress.push(label ?? '')
        )
      }
      const changedName = `${originalName ?? ''} (integrasjonstest)`
      try {
        await sync(
          await adapter.project.updateProjectProperties({ GtProjectFinanceName: changedName }, true)
        )
        const row = await adapter.entityService.getEntityItem(siteId)
        assert.equal(row.GtProjectFinanceName, changedName)
        assert.equal(row.Title, title)
        assert.ok(
          progress.includes(strings.SyncProjectPropertiesValuesProgressLabel),
          `the sync reported ${JSON.stringify(progress)}`
        )
      } finally {
        // The project's own value back, synced as saving it would sync it.
        await sync(
          await adapter.project.updateProjectProperties(
            { GtProjectFinanceName: originalName },
            true
          )
        )
      }
      const row = await adapter.entityService.getEntityItem(siteId)
      assert.equal(
        row.GtProjectFinanceName ?? null,
        rowBefore.GtProjectFinanceName ?? null,
        'the hub row not restored'
      )
    })

    it(
      "fetches a program's risks through the risk matrix's data source, as the matrix on a program does",
      { skip: skipReason('programUrl') },
      async () => {
        const program = await connect(env.programUrl!)
        const adapter = await adapterFor(program)
        // The matrix's automatic mode searches on a program or a parent project, by this flag.
        assert.equal(
          await adapter.isParentProject(),
          true,
          'the program does not read as a program'
        )
        const dataSource = await adapter.resolveDataSource(
          '',
          RISK_MATRIX_DATA_SOURCE,
          resources.Lists_DataSources_Category_UncertaintyOverview_RisksChildren
        )
        const items = await adapter.fetchItemsFromDataSource(dataSource, MATRIX_PROPERTIES, true)
        assert.ok(items.length > 0, "the program's projects have no risks: the test needs some")
        const children = await adapter.getChildProjects()
        const searched = new Set(
          [
            ...children.map((child) => child.siteId),
            program.context.pageContext.site.id.toString()
          ].map(normalizeSiteId)
        )
        assert.ok(items.every((item) => searched.has(normalizeSiteId(item.SiteId))))
      }
    )
  }
)
