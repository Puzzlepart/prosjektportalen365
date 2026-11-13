/**
 * Runtime contract test for the hub reads of usage statistics against the REAL PnPjs 4 runtime.
 *
 * `PortalDataService.getUsageSnapshot` and `getSiteKind` compose their queries in
 * `usageQueries.ts`, which imports types only. The Jest suite runs them against structural
 * stand-ins that record the calls, because @pnp/* is ESM-only and Heft's Jest runner is CommonJS;
 * a stand-in cannot tell whether the calls give the request SharePoint expects. Node can load the
 * ESM PnPjs packages, so this file sends each query through PnPjs's own pipeline with a fake
 * transport and reads the URL that would have gone to the hub.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { spfi, DefaultHeaders, DefaultInit } from '@pnp/sp'
import '@pnp/sp/webs/index.js'
import '@pnp/sp/lists/index.js'
import '@pnp/sp/items/index.js'
import { DefaultParse } from '@pnp/queryable'

const require = createRequire(import.meta.url)
const {
  countFlagged,
  readItemCount,
  readNewestInstallation,
  readSiteFlags
} = require('../../lib-commonjs/services/PortalDataService/usageQueries.js')

const HUB = 'https://tenant.sharepoint.com/sites/hub'
const SITE_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

/** Replaces the network with one canned answer and records every request that was sent. */
function fakeTransport(body, seen, status = 200) {
  return (instance) => {
    instance.on.send.replace(async (url, init) => {
      seen.push({ url: new URL(url.toString()), init })
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
      })
    })
    return instance
  }
}

/** A list of the hub, as `PortalDataService` gets one from its hub web. */
function hubList(title, body, seen, status) {
  const sp = spfi(HUB).using(
    DefaultHeaders(),
    DefaultInit(),
    DefaultParse(),
    fakeTransport(body, seen, status)
  )
  return sp.web.lists.getByTitle(title)
}

/** The query of a request, as the names and values SharePoint receives. */
const queryOf = ({ url }) => Object.fromEntries(url.searchParams.entries())

test('the newest installation is asked for by its start time, with the version and channel only', async () => {
  const seen = []
  const list = hubList(
    'Installasjonslogg',
    { value: [{ InstallVersion: '1.15.0.a1b2c3d', InstallChannel: 'test' }] },
    seen
  )
  const rows = await readNewestInstallation(list)
  assert.deepEqual(rows, [{ InstallVersion: '1.15.0.a1b2c3d', InstallChannel: 'test' }])
  assert.equal(seen.length, 1)
  assert.equal(
    decodeURIComponent(seen[0].url.pathname),
    "/sites/hub/_api/web/lists/getByTitle('Installasjonslogg')/items"
  )
  assert.deepEqual(queryOf(seen[0]), {
    $select: 'InstallVersion,InstallChannel',
    $orderby: 'InstallStartTime desc',
    $top: '1'
  })
  assert.equal(seen[0].init.method, 'GET')
})

test("the number of projects is the list's own count: no row is read", async () => {
  const seen = []
  const count = await readItemCount(hubList('Prosjekter', { ItemCount: 412 }, seen))
  assert.equal(count, 412)
  assert.equal(
    decodeURIComponent(seen[0].url.pathname),
    "/sites/hub/_api/web/lists/getByTitle('Prosjekter')"
  )
  assert.deepEqual(queryOf(seen[0]), { $select: 'ItemCount' })
})

test('programs and parent projects are counted from the ids of the flagged rows, at most 5000', async () => {
  for (const flag of ['GtIsProgram', 'GtIsParentProject']) {
    const seen = []
    const count = await countFlagged(
      hubList('Prosjekter', { value: [{ Id: 3 }, { Id: 8 }] }, seen),
      flag
    )
    assert.equal(count, 2)
    assert.equal(
      decodeURIComponent(seen[0].url.pathname),
      "/sites/hub/_api/web/lists/getByTitle('Prosjekter')/items"
    )
    assert.deepEqual(queryOf(seen[0]), { $select: 'Id', $filter: `${flag} eq 1`, $top: '5000' })
  }
})

test('the flags of a site are read from its row, found by the site id', async () => {
  const seen = []
  const list = hubList(
    'Prosjekter',
    { value: [{ GtIsProgram: true, GtIsParentProject: true }] },
    seen
  )
  const rows = await readSiteFlags(list, SITE_ID)
  assert.deepEqual(rows, [{ GtIsProgram: true, GtIsParentProject: true }])
  assert.deepEqual(queryOf(seen[0]), {
    $select: 'GtIsProgram,GtIsParentProject',
    $filter: `GtSiteId eq '${SITE_ID}'`,
    $top: '1'
  })
})

test('nothing is cached: the same read asked twice sends two requests', async () => {
  const seen = []
  const list = () => hubList('Prosjekter', { value: [] }, seen)
  assert.deepEqual(await readSiteFlags(list(), SITE_ID), [])
  assert.deepEqual(await readSiteFlags(list(), SITE_ID), [])
  assert.equal(await countFlagged(list(), 'GtIsProgram'), 0)
  assert.equal(await countFlagged(list(), 'GtIsProgram'), 0)
  assert.equal(seen.length, 4)
})

test("a read the hub refuses rejects with the status, for the caller's own catch", async () => {
  const seen = []
  const threshold = {
    'odata.error': {
      message: {
        value: 'The attempted operation is prohibited because it exceeds the list view threshold.'
      }
    }
  }
  await assert.rejects(
    countFlagged(hubList('Prosjekter', threshold, seen, 500), 'GtIsProgram'),
    (error) => error.status === 500
  )
  await assert.rejects(
    readSiteFlags(hubList('Prosjekter', {}, seen, 403), SITE_ID),
    (error) => error.status === 403
  )
  await assert.rejects(
    readItemCount(hubList('Prosjekter', {}, seen, 404)),
    (error) => error.status === 404
  )
  await assert.rejects(
    readNewestInstallation(hubList('Installasjonslogg', {}, seen, 404)),
    (error) => error.status === 404
  )
})
