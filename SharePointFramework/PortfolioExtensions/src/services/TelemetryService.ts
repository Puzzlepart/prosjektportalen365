import { getGUID } from '@pnp/core'
import { Logger, LogLevel } from '@pnp/logging'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import {
  attachTelemetryPortal,
  errorCodeFrom,
  getTelemetryGate,
  ITelemetryGate,
  TelemetryErrorCode
} from 'pp365-shared-library/lib/telemetry'
import SPDataAdapter from 'data/SPDataAdapter'
import { PpPkgType } from 'models'
import { DEFAULT_CATALOG_URL, resolveCatalogUrl } from './catalogUrl'
import { featureFlags } from './featureFlags'

/**
 * Default ingestion endpoint (prosjektportalen-assist). Override per
 * installation via the command-set property `telemetryUrl`; an empty string
 * disables catalog events entirely (see the extension README's transparency
 * note for exactly what is sent).
 */
const DEFAULT_TELEMETRY_URL = 'https://assist.prosjektportalen.no/api/telemetry/catalog'

const REQUEST_TIMEOUT_MS = 10000

/** The kinds of registration `detail.removedType` may name. */
const REMOVED_TYPES: unknown[] = [PpPkgType.Lokal, PpPkgType.Importert, PpPkgType.Sentral]

/** Catalog operations recorded by install telemetry. */
export type TelemetryAction = 'install' | 'update' | 'remove' | 'publishCentral'

/**
 * The only extras an event may carry: whether publishing a cloud template skipped the taxonomy
 * step, or which kind of registration a removal removed. Anything else is left out.
 */
export type TelemetryEventDetail = { taxonomySkipped: boolean } | { removedType: PpPkgType }

/** Package action and outcome sent to the catalog telemetry endpoint. */
export interface ITelemetryEvent {
  action: TelemetryAction
  status: 'success' | 'error'
  packageId: string
  packageVersion: string
  packageType: string
  /**
   * The previously registered package version (update/remove flows) — read
   * from the cross-reference BEFORE it is refreshed.
   */
  previousVersion?: string
  /**
   * Installed Prosjektportalen platform version (from the installation log).
   */
  ppVersion?: string
  /**
   * The caught error, for `status: 'error'`. Only its code is sent (`errorCodeFrom`), and only at
   * level 3: an error's message can hold URLs and names, and never leaves the tenant.
   */
  error?: unknown
  /**
   * `taxonomySkipped` for publish-central, or `removedType` for a removal.
   */
  detail?: TelemetryEventDetail
}

/** What decides whether an event is sent, and where the hub's level is read from. */
export interface ITelemetryServiceProps {
  context: ListViewCommandSetContext
  /** The command-set property `telemetryUrl`: an empty string stops the catalog's events. */
  telemetryUrl?: string
  /** The command-set property `catalogUrl`: events are sent for the default catalog only. */
  catalogUrl?: string
}

/**
 * The event's `detail` as it may be sent: `taxonomySkipped` when it is a boolean, or
 * `removedType` when it is a kind of registration. A value the types let through by a cast is
 * dropped here.
 */
function allowedDetail(detail: unknown): TelemetryEventDetail | undefined {
  const { taxonomySkipped, removedType } = (detail ?? {}) as Record<string, unknown>
  if (typeof taxonomySkipped === 'boolean') return { taxonomySkipped }
  if (REMOVED_TYPES.indexOf(removedType) !== -1) return { removedType: removedType as PpPkgType }
  return undefined
}

/**
 * Sends best-effort catalog-action events to the prosjektportalen-assist ingestion endpoint,
 * without retries or HTTP status checks. Callers need not await it, and rejected requests are
 * logged without failing their package action.
 *
 * - Sent only when the hub's usage statistics allow it, by the one gate every sender asks
 *   (`getTelemetryGate`): `UsageStatisticsLevel` is `2` or `3` and `CatalogTelemetryEnabled` is
 *   exactly `1` in the hub's Globale innstillinger. A missing or disabled row, a hub that cannot
 *   be read and a decision that is not in yet all send nothing. `CatalogTelemetryEnabled` = `0`
 *   stops all of Prosjektportalen's telemetry, not only the catalog's.
 * - Sent only for the default catalog (`DEFAULT_CATALOG_URL`): a customer's own catalog names its
 *   packages itself, and those names stay in the tenant.
 * - Includes tenant host, hub URL and AAD tenant id (deliberate, documented in the extension
 *   README) and the level. A failure is sent as an error code, at level 3 only; an error's
 *   message is never sent, and neither is a client timestamp.
 * - Sent without cookies (`credentials: 'omit'`) and without the page's address
 *   (`referrerPolicy: 'no-referrer'`).
 * - Also stopped by the `telemetryUrl: ""` property, the `PP_DISABLE_TELEMETRY` session flag
 *   and the browser's Global Privacy Control or Do Not Track.
 */
export class TelemetryService {
  /** Sends one event when the gate allows it; logs failures without rejecting. */
  public static async track(props: ITelemetryServiceProps, event: ITelemetryEvent): Promise<void> {
    try {
      const url = TelemetryService._resolveUrl(props.telemetryUrl)
      if (!url) return
      if (resolveCatalogUrl(props.catalogUrl) !== DEFAULT_CATALOG_URL) return
      const gate = TelemetryService._gate()
      if (!gate.catalog) return
      const { pageContext } = props.context
      const siteUrl = pageContext.web.absoluteUrl
      const body = JSON.stringify({
        eventId: getGUID(),
        action: event.action,
        status: event.status,
        errorCode: TelemetryService._errorCode(event, gate),
        packageId: event.packageId,
        packageVersion: event.packageVersion,
        packageType: event.packageType,
        previousVersion: event.previousVersion,
        ppVersion: event.ppVersion,
        tenantId: pageContext.legacyPageContext?.aadTenantId,
        host: new URL(siteUrl).host,
        siteUrl,
        detail: allowedDetail(event.detail),
        level: gate.level
      })
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      try {
        // keepalive lets the request survive the drawer/page being closed
        // right after the action completes.
        await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
          keepalive: true,
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          signal: controller.signal
        })
      } finally {
        clearTimeout(timer)
      }
    } catch (error) {
      Logger.log({
        message: `(TelemetryService) track failed (ignored): ${error?.message}`,
        level: LogLevel.Info
      })
    }
  }

  /**
   * The gate's answer for the catalog, right now. The hub's level is read through the hub's own
   * data service, attached without settings: the catalog holds none, so the gate reads them with
   * the service's cached `getGlobalSettings`. The command set attaches it as it starts, long
   * before an action ends; an answer that is not in yet is a closed gate, and the event is
   * dropped. No setting is read or tested here.
   */
  private static _gate(): ITelemetryGate {
    attachTelemetryPortal(SPDataAdapter.portalDataService)
    return getTelemetryGate()
  }

  /**
   * The code of a failed action's error, at level 3 only. It comes from the error's HTTP status
   * or type (`errorCodeFrom`), never from its message.
   */
  private static _errorCode(
    event: ITelemetryEvent,
    gate: ITelemetryGate
  ): TelemetryErrorCode | undefined {
    return event.status === 'error' && gate.level === 3 ? errorCodeFrom(event.error) : undefined
  }

  /**
   * Resolves the effective endpoint: `undefined` when the catalog's events are off
   * (session flag or explicit empty-string property), otherwise the configured
   * or default URL.
   */
  private static _resolveUrl(telemetryUrl?: string): string | undefined {
    if (!featureFlags.isTelemetryEnabled()) return undefined
    if (telemetryUrl === '') return undefined
    return telemetryUrl || DEFAULT_TELEMETRY_URL
  }
}
