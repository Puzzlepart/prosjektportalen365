import {
  ITelemetryBatch,
  ITelemetryErrorEntry,
  ITelemetryHeartbeat,
  ITelemetrySiteEntry,
  ITelemetryTimingEntry,
  ITelemetryUsageEntry,
  MAX_BATCH_BYTES,
  MAX_ENTRY_COUNT,
  MAX_ERROR_ENTRIES,
  MAX_SITE_ENTRIES,
  MAX_TIMING_ENTRIES,
  MAX_USAGE_ENTRIES,
  TELEMETRY_FIELDS,
  TELEMETRY_SCHEMA
} from './contract'
import { osloYearMonth } from './siteHash'
import { currentTelemetryDecision, ITelemetryStore } from './store'
import { normalizeHubUrl, utf8ByteLength } from './validate'

/** A batch id's length, for measuring a batch before it has one. */
const BATCH_ID_PLACEHOLDER = '00000000-0000-4000-8000-000000000000'

/** A batch while it is filled, with its size in bytes as an upper bound. */
interface IOpenBatch {
  heartbeat?: ITelemetryHeartbeat
  usage: Record<string, ITelemetryUsageEntry>
  usageCount: number
  sites: Record<string, ITelemetrySiteEntry>
  siteCount: number
  errors: ITelemetryErrorEntry[]
  timings: ITelemetryTimingEntry[]
  bytes: number
}

/**
 * Writes the values under the contract's field names, in the contract's order, leaving out what is
 * undefined. A field the contract does not name cannot be written.
 */
function inFieldOrder<T>(fields: readonly string[], values: T): T {
  const ordered: Record<string, unknown> = {}
  fields.forEach((field) => {
    const value = (values as Record<string, unknown>)[field]
    if (value !== undefined) ordered[field] = value
  })
  return ordered as T
}

/** The bytes an entry adds to a batch: its JSON and the comma before the next one. */
function entryBytes(entry: unknown): number {
  return utf8ByteLength(JSON.stringify(entry)) + 1
}

/** The bytes a field adds to a batch the first time it gets an entry: `,"name":[]`. */
function fieldBytes(name: string): number {
  return name.length + 6
}

/** A record's values, ordered by their keys: the same counts always give the same batch. */
function sortedValues<T>(record: Record<string, T>): T[] {
  return Object.keys(record)
    .sort()
    .map((key) => record[key])
}

/** Whether a batch carries one of the kinds a batch must have at least one of. */
function hasContent(batch: IOpenBatch): boolean {
  return !!batch.heartbeat || batch.usageCount + batch.errors.length + batch.timings.length > 0
}

/**
 * The queued heartbeat as it is sent, with the gate's catalog flag, taken out of the store.
 */
function takeHeartbeat(store: ITelemetryStore, catalog: boolean): ITelemetryHeartbeat | undefined {
  const queued = store.heartbeat
  store.heartbeat = undefined
  return queued && inFieldOrder(TELEMETRY_FIELDS.heartbeat, { ...queued, catalog })
}

/**
 * The `sites` entry of a site: its hash for this month with its type, or `undefined` while the
 * hash is not computed. A hash from another month is forgotten, so that it is computed again: the
 * tab was left open over the turn of the month.
 */
function siteEntryOf(
  store: ITelemetryStore,
  siteId: string,
  siteType: ITelemetrySiteEntry['s'],
  month: string | undefined
): ITelemetrySiteEntry | undefined {
  const siteHash = store.siteHashes[siteId]
  if (!siteHash) return undefined
  if (siteHash.month !== month) {
    delete store.siteHashes[siteId]
    delete store.siteHashRequested[siteId]
    return undefined
  }
  return { h: siteHash.hash, s: siteType }
}

/**
 * Builds the batches a flush sends, from memory alone, and takes what they hold out of the store.
 *
 * Nothing is built while the gate has no decision for the page's hub, while the decision is older
 * than `GATE_MAX_AGE_MS` or says level 0, or while the envelope cannot be filled in (no valid host,
 * hub URL or version). Everything then stays in memory.
 *
 * A batch carries only what its level allows: the heartbeat from level 1, usage and sites from
 * level 2, errors and timings at level 3. A usage counter is sent with its site's type in place of
 * the site id; a counter whose site type is not known yet stays for the next flush. `sites` lists
 * the monthly hash of each site with usage in the batch, leaving out a site without a hash for
 * this month. Batches are split so that each stays within the contract's entry counts and
 * `MAX_BATCH_BYTES`.
 *
 * @param store The window's store
 * @param now The time
 * @param createBatchId Gives each batch its random id
 */
export function drainTelemetryBatches(
  store: ITelemetryStore,
  now: number,
  createBatchId: () => string
): ITelemetryBatch[] {
  const decision = currentTelemetryDecision(store, now)
  if (!decision || decision.level < 1) return []
  const { host, tenantId, appVersion } = store.page
  const hubUrl = normalizeHubUrl(store.anchor.portal.url, host)
  if (!host || !hubUrl || !appVersion) return []
  const level = decision.level as ITelemetryBatch['level']

  const envelope = (batchId: string, content: Partial<ITelemetryBatch>): ITelemetryBatch =>
    inFieldOrder(TELEMETRY_FIELDS.envelope, {
      schema: TELEMETRY_SCHEMA,
      batchId,
      host,
      tenantId: tenantId || undefined,
      hubUrl,
      level,
      appVersion,
      ...content
    })
  const envelopeBytes = utf8ByteLength(JSON.stringify(envelope(BATCH_ID_PLACEHOLDER, {})))
  const open = (heartbeat?: ITelemetryHeartbeat): IOpenBatch => ({
    heartbeat,
    usage: {},
    usageCount: 0,
    sites: {},
    siteCount: 0,
    errors: [],
    timings: [],
    bytes: envelopeBytes + (heartbeat ? fieldBytes('heartbeat') + entryBytes(heartbeat) : 0)
  })

  const batches: IOpenBatch[] = [open(takeHeartbeat(store, decision.catalog))]
  /** The batch being filled: a new one when the last cannot take `bytes` more, or is full. */
  const batchWithRoom = (
    bytes: (batch: IOpenBatch) => number,
    isFull: (batch: IOpenBatch) => boolean
  ) => {
    const last = batches[batches.length - 1]
    if (!isFull(last) && last.bytes + bytes(last) <= MAX_BATCH_BYTES) return last
    batches.push(open())
    return batches[batches.length - 1]
  }

  if (level >= 2) {
    const month = osloYearMonth(new Date(now))
    Object.keys(store.usage)
      .sort()
      .forEach((key) => {
        const { siteId, c, e, v, n } = store.usage[key]
        const s = store.siteTypes[siteId]
        if (!s) return
        delete store.usage[key]
        const entry = inFieldOrder<ITelemetryUsageEntry>(TELEMETRY_FIELDS.usage, { c, e, s, v, n })
        const entryKey = [c, e, s, v].join('|')
        const site = siteEntryOf(store, siteId, s, month)
        const isNewEntry = (batch: IOpenBatch) => !batch.usage[entryKey]
        const isNewSite = (batch: IOpenBatch) => !!site && !batch.sites[site.h]
        // An entry is measured with the highest count: summing into it never grows the batch.
        const bytes = (batch: IOpenBatch) =>
          (isNewEntry(batch) ? entryBytes({ ...entry, n: MAX_ENTRY_COUNT }) : 0) +
          (isNewEntry(batch) && !batch.usageCount ? fieldBytes('usage') : 0) +
          (isNewSite(batch) ? entryBytes(site) : 0) +
          (isNewSite(batch) && !batch.siteCount ? fieldBytes('sites') : 0)
        const batch = batchWithRoom(
          bytes,
          (candidate) =>
            (isNewEntry(candidate) && candidate.usageCount >= MAX_USAGE_ENTRIES) ||
            (isNewSite(candidate) && candidate.siteCount >= MAX_SITE_ENTRIES)
        )
        batch.bytes += bytes(batch)
        if (isNewSite(batch)) {
          batch.sites[site.h] = site
          batch.siteCount++
        }
        if (isNewEntry(batch)) {
          batch.usage[entryKey] = entry
          batch.usageCount++
        } else {
          batch.usage[entryKey].n = Math.min(MAX_ENTRY_COUNT, batch.usage[entryKey].n + n)
        }
      })
  }

  if (level >= 3) {
    sortedValues(store.errors).forEach(({ c, code, http, n }) => {
      const entry = inFieldOrder<ITelemetryErrorEntry>(TELEMETRY_FIELDS.errors, {
        c,
        code,
        http,
        n
      })
      const bytes = (batch: IOpenBatch) =>
        entryBytes(entry) + (batch.errors.length ? 0 : fieldBytes('errors'))
      const batch = batchWithRoom(
        bytes,
        (candidate) => candidate.errors.length >= MAX_ERROR_ENTRIES
      )
      batch.bytes += bytes(batch)
      batch.errors.push(entry)
    })
    store.errors = {}
    sortedValues(store.timings).forEach(({ c, m, h }) => {
      const entry = inFieldOrder<ITelemetryTimingEntry>(TELEMETRY_FIELDS.timings, { c, m, h })
      const bytes = (batch: IOpenBatch) =>
        entryBytes(entry) + (batch.timings.length ? 0 : fieldBytes('timings'))
      const batch = batchWithRoom(
        bytes,
        (candidate) => candidate.timings.length >= MAX_TIMING_ENTRIES
      )
      batch.bytes += bytes(batch)
      batch.timings.push(entry)
    })
    store.timings = {}
  }

  return batches.filter(hasContent).map((batch) => {
    const usage = sortedValues(batch.usage)
    const sites = sortedValues(batch.sites)
    return envelope(createBatchId(), {
      heartbeat: batch.heartbeat,
      usage: usage.length ? usage : undefined,
      sites: usage.length && sites.length ? sites : undefined,
      errors: batch.errors.length ? batch.errors : undefined,
      timings: batch.timings.length ? batch.timings : undefined
    })
  })
}
