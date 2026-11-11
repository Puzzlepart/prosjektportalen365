/**
 * Runtime contract test for the ported term store client against the REAL PnPjs 4 runtime.
 *
 * The Jest suite tests this module against structural stand-ins because @pnp/* is ESM-only and
 * Heft's Jest runner is CommonJS. That gap let a real defect ship: getTermStore threw inside SPFx,
 * where spfi().using(SPFx(context)) keeps URLs relative until request time. Node can load the ESM
 * PnPjs packages, so this file runs with `node --test` as part of the build and exercises the
 * whole request pipeline with a fake transport, in both URL modes SPFx and spfi(url) produce.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { spfi, SPQueryable, DefaultHeaders, DefaultInit } from '@pnp/sp'
import '@pnp/sp/webs/index.js'
import { DefaultParse } from '@pnp/queryable'
import { combine, isUrlAbsolute } from '@pnp/core'

const require = createRequire(import.meta.url)
const { getTermStore } = require('../../lib-commonjs/taxonomy/termStore.js')

const WEB = 'https://tenant.sharepoint.com/sites/project'
const SET_ID = 'abcfc9d9-a263-4abb-8234-be973c46258a'

/**
 * Emulates the URL resolution of @pnp/sp's SPFx behaviour: relative request URLs get the web URL.
 * The real behaviour registers this with `pre.prepend`, so it runs before PnPjs's own telemetry
 * step, which parses the URL; the emulation must do the same.
 */
function spfxLikeUrlResolution(instance) {
  instance.on.pre.prepend(async (url, init, result) => [isUrlAbsolute(url) ? url : combine(WEB, url), init, result])
  return instance
}

/** Replaces the network with canned OData pages and records every URL that was requested. */
function fakeTransport(pages, seen) {
  return (instance) => {
    instance.on.send.replace(async (url) => {
      const key = url.toString()
      seen.push(key)
      const page = pages.find((p) => key.includes(p.match)) ?? { body: { value: [] } }
      return new Response(JSON.stringify(page.body), { status: 200, headers: { 'content-type': 'application/json' } })
    })
    return instance
  }
}

const term = (id, name) => ({ id, labels: [{ name, languageTag: 'nb-NO', isDefault: true }], localProperties: [] })

test('resolves the term store relative to the current web, like SPFx does', async () => {
  const seen = []
  const sp = spfi().using(DefaultHeaders(), DefaultInit(), DefaultParse(), spfxLikeUrlResolution, fakeTransport([{ match: '/terms', body: { value: [term('t1', 'Konsept')] } }], seen))
  assert.equal(sp.web.toUrl(), '_api/web', 'precondition: SPFx style spfi() keeps URLs relative')
  const terms = await getTermStore(sp.web).sets.getById(SET_ID).terms.select('*', 'localProperties').all()
  assert.equal(terms.length, 1)
  assert.equal(terms[0].labels[0].name, 'Konsept')
  assert.match(seen[0], new RegExp(`^${WEB}/_api/v2\\.1/termstore/sets/${SET_ID}/terms\\?`), 'request went to the current web')
})

test('pins the term store to the web of an absolute spfi(url)', async () => {
  const seen = []
  const hub = 'https://tenant.sharepoint.com/sites/hub'
  const sp = spfi(hub).using(DefaultHeaders(), DefaultInit(), DefaultParse(), fakeTransport([{ match: '/termstore?', body: { id: 'store' } }, { match: '/termstore', body: { id: 'store' } }], seen))
  const store = await getTermStore(sp.web)()
  assert.equal(store.id, 'store')
  assert.equal(seen[0], `${hub}/_api/v2.1/termstore`)
})

test('follows nextLink across pages and honours the page size', async () => {
  const seen = []
  const next = `${WEB}/_api/v2.1/termstore/sets/${SET_ID}/terms?$skiptoken=abc`
  const sp = spfi().using(DefaultHeaders(), DefaultInit(), DefaultParse(), spfxLikeUrlResolution, fakeTransport([
    { match: 'skiptoken=abc', body: { value: [term('t2', 'Planlegge')] } },
    { match: '/terms', body: { value: [term('t1', 'Konsept')], '@odata.nextLink': next } }
  ], seen))
  const terms = await getTermStore(sp.web).sets.getById(SET_ID).terms.all(1)
  assert.deepEqual(terms.map((t) => t.id), ['t1', 't2'])
  assert.equal(seen.length, 2)
  assert.match(seen[0], /%24top=1|\$top=1/)
})

test('throws a clear error when given something that is not a queryable', () => {
  assert.throws(() => getTermStore({}), /pass a configured queryable/)
})
