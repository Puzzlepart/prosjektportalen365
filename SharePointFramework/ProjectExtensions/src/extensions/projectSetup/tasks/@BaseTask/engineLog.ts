import { FunctionListener, ILogEntry as IPnPLogEntry, LogLevel, Logger } from '@pnp/logging'
import { ILogEntry } from '../types'

let capture: ((entry: IPnPLogEntry) => void) | undefined
let subscribed = false

/** Chooses warning-level engine logging, or informational logging while debugging. */
export function engineLogLevel(): LogLevel {
  return sessionStorage.DEBUG === '1' || DEBUG ? LogLevel.Info : LogLevel.Warning
}

/**
 * Forwards engine warnings and errors while a provisioning operation runs.
 *
 * The engine can log failures without rejecting. PnP logging cannot unsubscribe a listener,
 * so a single persistent listener forwards only during capture.
 *
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
