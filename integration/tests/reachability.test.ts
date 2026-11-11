import assert from 'node:assert/strict'
import { before, describe, it } from 'node:test'
import { env, skipReason } from '../src/env.ts'
import { termStore } from '../src/library.ts'
import type { ISite } from '../src/sites.ts'
import { appOnlyDenied, connect, TERM_STORE_PERMISSION } from '../src/sites.ts'

/**
 * What the data layer reaches in the sign-in mode of this run: the hub's REST API, search and the
 * term store. App-only (CI) these need the app's permissions, signed in as the e2e user (locally)
 * the user's; a failure here names what is missing before any test of the services does.
 */
describe('reachable from Node', { skip: skipReason('hubUrl') }, () => {
  let hub: ISite

  before(async () => {
    hub = await connect(env.hubUrl!)
  })

  it("reads the hub's web", async (t) => {
    t.diagnostic(`signed in with ${hub.mode}`)
    const web = await hub.sp.web.select('Title', 'Url')()
    assert.equal(web.Url.toLowerCase(), hub.url.toLowerCase())
    assert.ok(web.Title)
  })

  it("searches the hub's sites", async () => {
    const hubSiteId = hub.context.pageContext.legacyPageContext.hubSiteId
    const results = await hub.sp.search({
      Querytext: `contentclass:STS_Site DepartmentId:${hubSiteId}`,
      SelectProperties: ['Title', 'Path', 'SiteId'],
      RowLimit: 10,
      TrimDuplicates: false
    })
    assert.ok(
      results.PrimarySearchResults.length > 0,
      'search returned no site of the hub: app-only search needs the app to have Sites.Read.All or more'
    )
    // Search returns every value as text: the reason the library's sorting reads numbers itself.
    assert.equal(typeof results.PrimarySearchResults[0].SiteId, 'string')
  })

  it("reads the phases from the term store, through the library's client", async (t) => {
    // The term set the hub's phase field is bound to, as the phase web part reads it.
    const { TermSetId } = await hub.sp.web.fields
      .getByInternalNameOrTitle('GtProjectPhase')
      .select('TermSetId')<{ TermSetId: string }>()
    const phases = () =>
      termStore()
        .getTermStore(hub.sp.web)
        .sets.getById(TermSetId)
        .terms.select('*', 'localProperties')
        .all()
    const denied = await appOnlyDenied(hub, phases, TERM_STORE_PERMISSION)
    if (denied) return t.skip(denied)
    const terms = await phases()
    assert.ok(terms.length > 0, `the phase term set ${TermSetId} has no terms`)
    assert.ok(terms.every((term) => term.labels?.length > 0))
  })
})
