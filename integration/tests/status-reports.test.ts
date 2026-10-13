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

/** The report series ("delprosjekt") the test writes in, apart from the project's own reports. */
const SCOPE_KEY = 'ITEST'

/** The library's report series helpers. */
const scopes = () =>
  library<typeof import('pp365-shared-library/lib/util/statusReportScope.js')>(
    'util/statusReportScope.js'
  )

/**
 * The reserved project's status reports, written as the status page writes them through
 * `PortalDataService`: a draft created in a series of the test's own (`<site id>-ITEST`, a
 * "delprosjekt" series), filled in as the edit panel's save fills it, read back with its people,
 * and deleted. The project's own series is read before and after and must not change. What an
 * interrupted run left in the test's series is deleted first.
 */
describe(
  "the reserved project's status reports, as the status page writes them",
  { skip: skipReason('projectUrl') },
  () => {
    let portal: PortalDataService
    let siteId: string
    let scopedSiteId: string
    let contentTypeId: string | undefined
    let email: string

    before(async () => {
      const project: ISite = await connect(env.projectUrl!)
      const { PortalDataService } = portalDataService()
      // Configured as the status page configures it: from the project's context, finding its hub.
      portal = await new PortalDataService().configure({ spfxContext: project.context })
      siteId = project.context.pageContext.site.id.toString()
      scopedSiteId = scopes().buildScopedSiteId(siteId, SCOPE_KEY)
      email = project.context.pageContext.user.email
      const { ProjectDataService } = projectDataService()
      const data = await new ProjectDataService({
        webUrl: project.url,
        siteId,
        spfxContext: project.context,
        propertiesListName: resources.Lists_ProjectProperties_Title,
        entityService: undefined as any
      }).getProjectInformationData()
      // The status content type the project's template names, as the new report command passes it.
      contentTypeId = data.templateParameters?.ProjectStatusContentTypeId
      for (const leftover of await seriesReports()) await portal.deleteStatusReport(leftover.id)
    })

    /** The reports of the test's series, fresh from the hub, with their people expanded. */
    const seriesReports = () =>
      portal.getStatusReports({
        filter: `GtSiteId eq '${scopedSiteId}'`,
        useCaching: false,
        userFields: ['GtProjectManager']
      })

    /** The ids of the project's own series, newest first. */
    const ownReportIds = async () =>
      (await portal.getStatusReports({ useCaching: false })).map((report) => report.id)

    it('creates a draft in a series of its own, fills it in, reads it back with its people, and deletes it', async (t) => {
      const ownBefore = await ownReportIds()
      const { Choices: riskLevels } = await portal.web.lists
        .getByTitle(resources.Lists_ProjectStatus_Title)
        .fields.getByInternalNameOrTitle('GtStatusRisk')
        .select('Choices')<{ Choices: string[] }>()
      const risk = riskLevels[1] ?? riskLevels[0]
      let reportId: number | undefined
      try {
        // The new report command's draft, of the template's status content type ...
        const draft = await portal.addStatusReport(
          {
            Title: `Integrasjonstest ${Date.now()}`,
            GtSiteId: scopedSiteId,
            GtModerationStatus: resources.Choice_GtModerationStatus_Draft
          },
          contentTypeId ?? ''
        )
        reportId = draft.id
        assert.ok(reportId > 0, 'the draft has no id')
        // ... and the edit panel's save: a status, its comment and a person (`ensureUser` on the hub).
        const manager = email ? await portal.web.ensureUser(email) : undefined
        if (!manager) t.diagnostic('no user to set as project manager: INTEGRATION_USER is not set')
        await portal.updateStatusReport(draft, {
          GtStatusRisk: risk,
          GtStatusRiskComment: 'Skrevet av integrasjonstesten',
          ...(manager ? { GtProjectManagerId: manager.Id } : {})
        })
        const [stored] = await seriesReports()
        assert.equal(stored?.id, reportId, 'the draft is not in its series')
        assert.equal(stored.moderationStatus, resources.Choice_GtModerationStatus_Draft)
        assert.equal(stored.published, false)
        assert.equal(stored.scopeKey, SCOPE_KEY)
        assert.equal(stored.projectSiteId, siteId)
        assert.equal(stored.fieldValues.get('GtStatusRisk', { format: 'text' }), risk)
        assert.equal(
          stored.fieldValues.get('GtStatusRiskComment', { format: 'text' }),
          'Skrevet av integrasjonstesten'
        )
        if (contentTypeId) {
          assert.ok(
            String(stored.fieldValues.get('ContentTypeId', { format: 'text' })).startsWith(
              contentTypeId
            ),
            'the draft is not of the template status content type'
          )
        }
        if (manager) {
          // People come from a query of their own, expanded (`userFields`).
          const person = stored.fieldValues.get<any>('GtProjectManager')
          assert.equal(person?.value?.Id ?? person?.Id, manager.Id)
        }
        // A series of its own: not among the project's reports, among all its series.
        assert.ok(
          !(await ownReportIds()).includes(reportId),
          "the draft is in the project's own series"
        )
        const allSeries = await portal.getStatusReports({
          filter: scopes().getAllScopesFilter(siteId),
          useCaching: false
        })
        assert.ok(
          allSeries.some((report) => report.id === reportId),
          'the draft is not among all series'
        )
        await portal.deleteStatusReport(reportId)
        reportId = undefined
        assert.deepEqual(await seriesReports(), [], 'the draft is still there after the delete')
      } finally {
        if (reportId) await portal.deleteStatusReport(reportId)
      }
      assert.deepEqual(await ownReportIds(), ownBefore, "the project's own reports changed")
    })
  }
)
