import { getGUID } from '@pnp/core'
import { Logger, LogLevel } from '@pnp/logging'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import SPDataAdapter from 'data/SPDataAdapter'
import { featureFlags } from './featureFlags'

/**
 * Global settings (Globale innstillinger) key for the customer-facing
 * telemetry opt-out. Seeded as `1` (on); an admin sets the value to `0` to
 * stop all catalog telemetry for the installation. A missing row (installs
 * provisioned before the setting existed) counts as ON — the seeded default.
 */
const GLOBAL_SETTINGS_KEY = 'CatalogTelemetryEnabled'

/**
 * Default ingestion endpoint (prosjektportalen-assist). Override per
 * installation via the command-set property `telemetryUrl`; an empty string
 * disables telemetry entirely (see the extension README's transparency note
 * for exactly what is sent).
 */
const DEFAULT_TELEMETRY_URL = 'https://assist.prosjektportalen.no/api/telemetry/catalog'

/**
 * Error messages are truncated before sending — the receiving end stores them
 * for support/insight only.
 */
const ERROR_MESSAGE_MAX_LENGTH = 500

const REQUEST_TIMEOUT_MS = 10000

/** Catalog operations recorded by install telemetry. */
export type TelemetryAction = 'install' | 'update' | 'remove' | 'publishCentral'

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
   * Only for `status: 'error'`; truncated to {@link ERROR_MESSAGE_MAX_LENGTH}.
   */
  errorMessage?: string
  /**
   * Small optional extras (e.g. `taxonomySkipped` for publish-central).
   */
  detail?: Record<string, unknown>
}

/**
 * Sends best-effort catalog-action telemetry without retries or HTTP status checks.
 * Includes tenant host, hub URL and AAD tenant id; respects the endpoint, session
 * and installation-wide opt-outs. Callers need not await it, and rejected requests
 * are logged without failing their package action.
 */
export class TelemetryService {
  /** Sends one event when telemetry is enabled; logs failures without rejecting. */
  public static async track(
    props: { context: ListViewCommandSetContext; telemetryUrl?: string },
    event: ITelemetryEvent
  ): Promise<void> {
    try {
      const url = TelemetryService._resolveUrl(props.telemetryUrl)
      if (!url) return
      if (!(await TelemetryService._isEnabledInGlobalSettings())) return
      const { pageContext } = props.context
      const siteUrl = pageContext.web.absoluteUrl
      const body = JSON.stringify({
        eventId: getGUID(),
        action: event.action,
        status: event.status,
        errorMessage: event.errorMessage?.slice(0, ERROR_MESSAGE_MAX_LENGTH),
        packageId: event.packageId,
        packageVersion: event.packageVersion,
        packageType: event.packageType,
        previousVersion: event.previousVersion,
        ppVersion: event.ppVersion,
        tenantId: pageContext.legacyPageContext?.aadTenantId,
        host: new URL(siteUrl).host,
        siteUrl,
        detail: event.detail,
        clientTs: new Date().toISOString()
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
   * The installation-wide opt-out: the `CatalogTelemetryEnabled` row in the
   * hub's Globale innstillinger list. Only an explicit `0` disables — a
   * missing row or a failed read counts as ON (fail-open matches the seeded
   * default, and `getGlobalSettings` is session-cached so this costs one
   * request at most).
   */
  private static async _isEnabledInGlobalSettings(): Promise<boolean> {
    try {
      const settings = await SPDataAdapter.portalDataService.getGlobalSettings()
      return settings.get(GLOBAL_SETTINGS_KEY) !== '0'
    } catch {
      return true
    }
  }

  /**
   * Resolves the effective endpoint: `undefined` when telemetry is disabled
   * (session flag or explicit empty-string property), otherwise the configured
   * or default URL.
   */
  private static _resolveUrl(telemetryUrl?: string): string | undefined {
    if (!featureFlags.isTelemetryEnabled()) return undefined
    if (telemetryUrl === '') return undefined
    return telemetryUrl || DEFAULT_TELEMETRY_URL
  }
}
