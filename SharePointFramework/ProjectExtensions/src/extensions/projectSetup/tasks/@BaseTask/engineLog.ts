import { FunctionListener, ILogEntry as IPnPLogEntry, LogLevel, Logger } from '@pnp/logging'
import { ILogEntry } from '../types'

/**
 * Receives the page's log lines while `captureEngineLog` runs, and is `undefined` the rest of the
 * time.
 */
let capture: ((entry: IPnPLogEntry) => void) | undefined
let subscribed = false

/**
 * The log level to set up sp-js-provisioning with. `WebProvisioner.setup` sets it on the
 * `Logger` the setup shares with the engine: warnings and errors, and information when debugging.
 */
export function engineLogLevel(): LogLevel {
  return sessionStorage.DEBUG === '1' || DEBUG ? LogLevel.Info : LogLevel.Warning
}

/**
 * Runs `apply`, an `applyTemplate` of sp-js-provisioning, and sends each Warning and Error line
 * logged meanwhile to `forward` as it is logged. Since 1.5.0 the engine logs many failures and goes
 * on (a site column, list field, view field or content type binding SharePoint refuses, a data row),
 * so a step can succeed with its errors only in the log. `@pnp/logging` cannot unsubscribe a
 * listener, so one is subscribed once and does nothing outside a capture, as in `PackageInstaller`
 * (PortfolioExtensions).
 *
 * @param apply Applies the template
 * @param forward Receives each Warning and Error line
 * @param prefix The prefix the engine was set up with, left out of the lines `forward` receives
 */
export async function captureEngineLog<T>(
  apply: () => Promise<T>,
  forward: (entry: ILogEntry) => void,
  prefix = ''
): Promise<T> {
  if (!subscribed) {
    subscribed = true
    Logger.subscribe(FunctionListener((entry) => capture?.(entry)))
  }
  capture = (entry) => {
    if (!entry?.message || entry.level < LogLevel.Warning) return
    const message =
      prefix && entry.message.startsWith(prefix)
        ? entry.message.slice(prefix.length).trim()
        : entry.message
    try {
      forward({ message, level: entry.level >= LogLevel.Error ? 'error' : 'warning' })
    } catch {
      // The listener runs inside the engine's log call: a failure here must not fail the engine.
    }
  }
  try {
    return await apply()
  } finally {
    capture = undefined
  }
}
