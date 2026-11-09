import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { env, skipReason } from '../src/env.ts'
import { portalDataService } from '../src/library.ts'
import { connect } from '../src/sites.ts'

/**
 * `PortalDataService`, the library's client of the portfolio hub, configured as a web part
 * configures it, against the test hub.
 */
describe('PortalDataService', { skip: skipReason('hubUrl') }, () => {
  /** Columns every hub gets from the template (`Templates/Portfolio/Objects/Lists/Prosjektkolonner.xml`). */
  const TEMPLATE_COLUMNS = [
    'Title',
    'GtProjectPhase',
    'GtProjectManager',
    'GtStartDate',
    'GtEndDate'
  ]

  it("reads the hub's project columns, each with its field's internal name", async () => {
    const hub = await connect(env.hubUrl!)
    const { PortalDataService } = portalDataService()
    const portal = await new PortalDataService().configure({
      spfxContext: hub.context,
      url: hub.url
    })
    assert.ok(portal.isAvailable, 'the hub is not available to the service')
    const columns = await portal.getProjectColumns()
    const internalNames = columns.map((column) => column.internalName)
    for (const name of TEMPLATE_COLUMNS) {
      assert.ok(internalNames.includes(name), `the template's column ${name} is missing`)
    }
    assert.ok(
      columns.every((column) => column.internalName && column.fieldName),
      'every column has an internal name and a field name'
    )
  })

  it(
    'finds the hub from a project, as a web part on the project does',
    { skip: skipReason('projectUrl') },
    async () => {
      const project = await connect(env.projectUrl!)
      const { PortalDataService } = portalDataService()
      const portal = await new PortalDataService().configure({ spfxContext: project.context })
      assert.ok(portal.isAvailable, "the project's hub is not available to the service")
      assert.equal(
        portal.url.replace(/\/+$/, '').toLowerCase(),
        env.hubUrl!.replace(/\/+$/, '').toLowerCase()
      )
    }
  )
})
