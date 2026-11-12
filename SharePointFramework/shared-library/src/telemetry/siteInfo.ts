import { TelemetrySiteType } from './contract'
import { computeSiteHash, osloYearMonth } from './siteHash'
import { currentTelemetryDecision, ITelemetryStore } from './store'
import { isTelemetrySiteType } from './validate'

/** The site types a resolver may answer: a hub page is known without one. */
export type TelemetryResolvedSiteType = Exclude<TelemetrySiteType, 'hub'>

/** Swallows a rejection: a site without a type or a hash is left out, and nothing else follows. */
function ignore(): void {
  return undefined
}

/**
 * Asks the site's resolver for its type, once, and keeps the answer in memory. A resolver that
 * fails leaves the site without a type, and its usage is never sent.
 */
function requestSiteType(store: ITelemetryStore, siteId: string): void {
  const resolver = store.siteTypeResolvers[siteId]
  if (!resolver || store.siteTypes[siteId] || store.siteTypeRequested[siteId]) return
  store.siteTypeRequested[siteId] = true
  delete store.siteTypeResolvers[siteId]
  Promise.resolve()
    .then(resolver)
    .then((siteType) => {
      if (isTelemetrySiteType(siteType) && siteType !== 'hub') store.siteTypes[siteId] = siteType
    }, ignore)
}

/** Computes the site's hash for this month, once, and keeps it in memory. */
function requestSiteHash(store: ITelemetryStore, siteId: string, now: Date): void {
  if (store.siteHashes[siteId] || store.siteHashRequested[siteId]) return
  store.siteHashRequested[siteId] = true
  const month = osloYearMonth(now)
  computeSiteHash(siteId, now).then((hash) => {
    if (hash && month) store.siteHashes[siteId] = { month, hash }
  }, ignore)
}

/**
 * Starts the background lookups a flush will need for the sites in memory: each site's type, from
 * the resolver a bundle registered, and its monthly hash. Runs only once the gate has resolved at
 * level 2 or 3 for the page's hub, so a hub at a lower level costs no read and no hash. A flush
 * never waits for these: what is not known yet stays out of the batch.
 *
 * @param store The window's store
 * @param now The time
 */
export function ensureTelemetrySiteInfo(store: ITelemetryStore, now: number): void {
  const decision = currentTelemetryDecision(store, now)
  if (!decision || decision.level < 2) return
  const siteIds: Record<string, boolean> = {}
  if (store.page.siteId) siteIds[store.page.siteId] = true
  Object.keys(store.usage).forEach((key) => (siteIds[store.usage[key].siteId] = true))
  Object.keys(siteIds).forEach((siteId) => {
    requestSiteType(store, siteId)
    requestSiteHash(store, siteId, new Date(now))
  })
}
