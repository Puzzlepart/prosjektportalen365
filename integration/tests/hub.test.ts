import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { before, describe, it } from 'node:test'
import type { PortalDataService } from 'pp365-shared-library/lib/services/PortalDataService/index.js'
import { env, skipReason } from '../src/env.ts'
import { library, portalDataService, projectDataService } from '../src/library.ts'
import type { ISite } from '../src/sites.ts'
import { connect } from '../src/sites.ts'

const require = createRequire(import.meta.url)
const resources = require('SharedResources') as Record<string, string>

/** The title of every column this suite creates, to find what an interrupted run left behind. */
const COLUMN_PREFIX = 'Integrasjonstest'

/** A site id as the hub's rows and the page context hold it: without braces, in lower case. */
const normalizeSiteId = (siteId: unknown) =>
  String(siteId ?? '')
    .replace(/[{}]/g, '')
    .toLowerCase()

/** A view's stored column ids and own column order, as the views list holds them. */
interface IStoredView {
  GtPortfolioColumnsId?: number[] | { results: number[] }
  GtPortfolioColumnOrder?: string | null
}

const columnIdsOf = ({ GtPortfolioColumnsId: ids }: IStoredView) =>
  Array.isArray(ids) ? ids : (ids?.results ?? [])

const columnOrderOf = ({ GtPortfolioColumnOrder: order }: IStoredView): number[] => {
  try {
    return order ? JSON.parse(order) : []
  } catch {
    return []
  }
}

/** A project as the hub relates it: its URL, and the URLs of its child projects. */
class RelatedProject {
  url: string
  childProjects: string[]
  constructor(item: { GtSiteUrl?: string; GtChildProjects?: string }) {
    this.url = item.GtSiteUrl ?? ''
    let children: Array<{ SPWebURL?: string; Path?: string }> = []
    try {
      children = JSON.parse(item.GtChildProjects || '[]')
    } catch {
      children = []
    }
    this.childProjects = children.map((child) => child.SPWebURL ?? child.Path ?? '')
  }
}

/**
 * The hub as the project's and the portfolio's web parts use it: the project's row through the
 * entity service, the sync of its properties to that row, a column added to a portfolio view,
 * the column configuration and global settings, and the program's relation to its projects.
 * Writes go to the reserved project's own row and to columns the test creates; a view a column
 * is added to is put back as it was. All restored in `finally`.
 */
describe('the hub', { skip: skipReason('hubUrl', 'projectUrl') }, () => {
  let hub: ISite
  let project: ISite
  let portal: PortalDataService
  let siteId: string

  before(async () => {
    ;[hub, project] = await Promise.all([connect(env.hubUrl!), connect(env.projectUrl!)])
    const { PortalDataService } = portalDataService()
    portal = await new PortalDataService().configure({ spfxContext: hub.context, url: hub.url })
    siteId = project.context.pageContext.site.id.toString()
  })

  /** The project's data adapter, configured as a web part on the project configures it. */
  async function projectAdapter() {
    const { SPDataAdapterBase } = library<
      typeof import('pp365-shared-library/lib/data/SPDataAdapterBase/index.js')
    >('data/SPDataAdapterBase/index.js')
    const adapter = new SPDataAdapterBase()
    await adapter.configure(project.context, { siteId, webUrl: project.url })
    assert.ok(adapter.entityService, 'the hub is not available to the project')
    return adapter
  }

  it("reads the project's row in the hub through the entity service, its links from the page's origin", async () => {
    const { entityService } = await projectAdapter()
    const [entity, row] = await Promise.all([
      entityService.fetchEntity(siteId, project.url),
      entityService.getEntityItem(siteId)
    ])
    // The row's values as text, as the project information panel shows them.
    const text = entity.fieldValues as Record<string, string>
    assert.equal(normalizeSiteId(text.GtSiteId), normalizeSiteId(siteId))
    const hubUrl = hub.url.toLowerCase()
    assert.ok(
      entity.urls.editFormUrl.toLowerCase().startsWith(`${new URL(hub.url).origin}/`),
      entity.urls.editFormUrl
    )
    assert.match(entity.urls.editFormUrl, new RegExp(`[?&]ID=${row.Id}(&|$)`))
    assert.ok(
      entity.urls.versionHistoryUrl
        .toLowerCase()
        .startsWith(`${hubUrl}/_layouts/15/versions.aspx?list=`),
      entity.urls.versionHistoryUrl
    )
    assert.ok(entity.fields.some((field) => field.InternalName === 'GtStartDate'))
  })

  it("syncs the project's properties to its row in the hub, as saving project information does", async () => {
    const adapter = await projectAdapter()
    const { ProjectDataService } = projectDataService()
    const service = new ProjectDataService({
      webUrl: project.url,
      siteId,
      spfxContext: project.context,
      propertiesListName: resources.Lists_ProjectProperties_Title,
      entityService: adapter.entityService
    })
    const local = (await service.getProjectInformationData()).fieldValues
    assert.ok(local, 'the reserved project has no properties item')
    const originalLocal = local.get('GtProjectFinanceName')?.value ?? null
    const row = await adapter.entityService.getEntityItem(siteId)
    const originalRow = {
      GtProjectFinanceName: row.GtProjectFinanceName ?? null,
      GtStartDate: row.GtStartDate ?? null
    }
    const financeName = `${originalLocal ?? ''} (integrasjonstest)`
    try {
      await service.updateProjectProperties({ GtProjectFinanceName: financeName })
      const changed = await service.getProjectInformationData()
      assert.ok(changed.fieldValues, 'the reserved project has no properties item')
      // Every property mapped as the save's sync maps it (`syncPropertyItemToHub`) ...
      const properties = await adapter.getMappedProjectProperties(changed.fieldValues, {
        customSiteFieldsGroup: changed.templateParameters?.CustomSiteFields,
        projectContentTypeId: changed.templateParameters?.ProjectContentTypeId
      })
      assert.equal(properties.GtProjectFinanceName, financeName)
      // ... and written to the row: here the two it checks, which it can put back exactly.
      await adapter.entityService.updateEntityItem(siteId, {
        GtProjectFinanceName: properties.GtProjectFinanceName,
        GtStartDate: properties.GtStartDate
      })
      const synced = await adapter.entityService.getEntityItem(siteId)
      assert.equal(synced.GtProjectFinanceName, financeName)
      // The same instant as the project's, whatever the machine's time zone.
      assert.equal(synced.GtStartDate, changed.fieldValues.get('GtStartDate')?.value ?? null)
    } finally {
      await service.updateProjectProperties({ GtProjectFinanceName: originalLocal })
      await adapter.entityService.updateEntityItem(siteId, originalRow)
    }
    const restored = await adapter.entityService.getEntityItem(siteId)
    assert.deepEqual(
      {
        GtProjectFinanceName: restored.GtProjectFinanceName ?? null,
        GtStartDate: restored.GtStartDate ?? null
      },
      originalRow,
      "the project's row in the hub not restored"
    )
  })

  it('adds a column at the end of a view, keeping the columns hidden in the portfolio, and removes it again', async (t) => {
    const { PermissionKind } = await import('@pnp/sp/security/index.js')
    if (
      !(await portal.currentUserHasPermissionsToList(
        'PROJECT_COLUMNS',
        PermissionKind.AddListItems
      ))
    ) {
      return t.skip("the run's user may not add columns to the hub")
    }
    const columnsList = hub.sp.web.lists.getByTitle(resources.Lists_ProjectColumns_Title)
    const viewsList = hub.sp.web.lists.getByTitle(resources.Lists_PortfolioViews_Title)
    await removeLeftoverColumns()
    // A shared view with an order of its own when there is one: the new column must join the order.
    const views = (await portal.getPortfolioOverviewViews()).filter((view) => !view.isPersonal)
    const target = views.find((view) => view.columnOrder.length > 0) ?? views[0]
    assert.ok(target, 'the hub has no shared portfolio view')
    const viewItem = viewsList.items.getById(target.id as number)
    const stored = () =>
      viewItem.select('GtPortfolioColumnsId', 'GtPortfolioColumnOrder')<IStoredView>()
    const original = await stored()
    /** The view as the portfolio overview holds it, its columns configured from the hub's. */
    const shownView = async () =>
      (await portal.getPortfolioOverviewViews())
        .find((view) => view.id === target.id)!
        .configure(await portal.getProjectColumns())
    const stamp = Date.now().toString().slice(-6)
    const column = (title: string, internalName: string) =>
      ({
        Title: `${COLUMN_PREFIX} ${title} ${stamp}`,
        GtInternalName: `${internalName}${stamp}`,
        GtManagedProperty: `${internalName}${stamp}`,
        GtSortOrder: 999,
        GtShowFieldPortfolio: true
      }) as any
    const created: number[] = []
    try {
      // A column the view holds but the portfolio does not show: added, then hidden there.
      const hidden = await portal.addColumnToPortfolioView(
        column('skjult', 'IntegrationHidden'),
        await shownView()
      )
      created.push(hidden)
      await portal.updateItemInList('PROJECT_COLUMNS', hidden, { GtShowFieldPortfolio: false })
      const added = await portal.addColumnToPortfolioView(
        column('kolonne', 'IntegrationColumn'),
        await shownView()
      )
      created.push(added)
      const after = await stored()
      assert.deepEqual(columnIdsOf(after), [...columnIdsOf(original), hidden, added])
      if (columnOrderOf(original).length > 0) {
        assert.deepEqual(columnOrderOf(after), [...columnOrderOf(original), hidden, added])
      }
      const shown = (await shownView()).columns.map((shownColumn) => shownColumn.id)
      assert.ok(
        shown.includes(added) && !shown.includes(hidden),
        `the view shows ${shown.join(', ')}`
      )
    } finally {
      await viewItem.update({
        GtPortfolioColumnsId: columnIdsOf(original),
        GtPortfolioColumnOrder: original.GtPortfolioColumnOrder ?? null
      })
      for (const id of created) await columnsList.items.getById(id).delete()
    }
    assert.deepEqual(columnIdsOf(await stored()), columnIdsOf(original), 'the view not restored')

    /** Removes what an interrupted run left: its columns, from the views that hold them and the list. */
    async function removeLeftoverColumns() {
      const leftovers = await columnsList.items
        .filter(`startswith(Title,'${COLUMN_PREFIX}')`)
        .select('Id')<Array<{ Id: number }>>()
      if (leftovers.length === 0) return
      const ids = leftovers.map(({ Id }) => Id)
      t.diagnostic(`removing ${ids.length} columns an earlier run left`)
      const items = await viewsList.items.select(
        'Id',
        'GtPortfolioColumnsId',
        'GtPortfolioColumnOrder'
      )<Array<IStoredView & { Id: number }>>()
      for (const view of items) {
        if (!columnIdsOf(view).some((id) => ids.includes(id))) continue
        const order = columnOrderOf(view)
        await viewsList.items.getById(view.Id).update({
          GtPortfolioColumnsId: columnIdsOf(view).filter((id) => !ids.includes(id)),
          ...(order.length > 0
            ? { GtPortfolioColumnOrder: JSON.stringify(order.filter((id) => !ids.includes(id))) }
            : {})
        })
      }
      for (const id of ids) await columnsList.items.getById(id).delete()
    }
  })

  it('reads the column configuration with the columns it names, and the global settings', async () => {
    const [config, columns, settings] = await Promise.all([
      portal.getProjectColumnConfig(),
      portal.getProjectColumns(),
      portal.getGlobalSettings()
    ])
    assert.ok(config.length > 0, 'the hub has no column configuration')
    // The configuration's column, read through its lookup, is the column with that id.
    for (const row of config) {
      const named = columns.find((projectColumn) => projectColumn.id === row.columnId)
      if (named)
        assert.equal(row.columnFieldName, named.internalName, `configuration row ${row.id}`)
    }
    assert.ok(settings.size > 0, 'the hub has no enabled global setting')
  })

  it(
    'relates the program and its projects both ways',
    { skip: skipReason('programUrl') },
    async () => {
      const program = await connect(env.programUrl!)
      const children = await portal.getChildProjects(
        program.context.pageContext.web.absoluteUrl,
        RelatedProject
      )
      assert.ok(children.length > 0, 'the test program has no projects')
      assert.ok(children.every((child) => child.url))
      const parents = await portal.getParentProjects(children[0].url, RelatedProject)
      assert.ok(
        parents.some((parent) => parent.url.toLowerCase() === program.url.toLowerCase()),
        `${children[0].url} does not name the program among its parents`
      )
    }
  )
})
