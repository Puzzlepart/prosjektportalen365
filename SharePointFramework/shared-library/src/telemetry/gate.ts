import { TelemetryLevel } from './contract'

/** The Globale innstillinger key that holds the level: `0`, `1`, `2` or `3`. */
export const USAGE_STATISTICS_LEVEL_KEY = 'UsageStatisticsLevel'

/** The Globale innstillinger key of the catalog's switch. Its value `0` stops all telemetry. */
export const CATALOG_TELEMETRY_KEY = 'CatalogTelemetryEnabled'

/** The session storage flag a tester sets to `1` to stop telemetry from that tab. */
export const DISABLE_TELEMETRY_FLAG = 'PP_DISABLE_TELEMETRY'

/** The rule that gave the gate's level. */
export type TelemetryGateReason =
  | 'tester-flag'
  | 'privacy-signal'
  | 'no-anchor'
  | 'anchor-unavailable'
  | 'catalog-opt-out'
  | 'no-level'
  | 'invalid-level'
  | 'setting'
  | 'pending'

/** What the gate decides on: the browser's signals, the anchor portal and its settings. */
export interface ITelemetryGateInput {
  /** The value of the session storage flag `PP_DISABLE_TELEMETRY`. */
  testerFlag?: unknown
  /** `navigator.globalPrivacyControl` */
  globalPrivacyControl?: unknown
  /** `navigator.doNotTrack` */
  doNotTrack?: unknown
  /** Whether a portal of the page's own hub is attached. */
  hasAnchor: boolean
  /** The anchor portal's `isAvailable`. */
  anchorAvailable: boolean
  /**
   * The anchor's global settings: enabled rows only, so a disabled or missing row is absent, and a
   * hub that could not be read gives an empty map.
   */
  settings?: Pick<Map<string, string>, 'has' | 'get'>
}

/** The gate's answer for every sender. */
export interface ITelemetryGate {
  level: TelemetryLevel
  /** Whether catalog events may be sent: level 2 or 3, and `CatalogTelemetryEnabled` exactly `1`. */
  catalog: boolean
  reason: TelemetryGateReason
}

/** The setting's value without surrounding whitespace, or `undefined` when the map has no such key. */
function settingOf(settings: ITelemetryGateInput['settings'], key: string): string | undefined {
  if (!settings || !settings.has(key)) return undefined
  const value = settings.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/** The closed gate, with the rule that closed it. */
function closed(reason: TelemetryGateReason): ITelemetryGate {
  return { level: 0, catalog: false, reason }
}

/**
 * Decides whether and how much this browser may send, for every sender, the catalog included. Pure
 * and fail-closed: the first matching rule gives the level, and the default level never comes from
 * code. Without an explicit, valid `UsageStatisticsLevel` row nothing is sent.
 *
 * 1. the tester flag is `1`;
 * 2. the browser asks not to be tracked (Global Privacy Control or Do Not Track);
 * 3. no portal of the page's own hub is attached;
 * 4. that portal is not available;
 * 5. `CatalogTelemetryEnabled` is `0`;
 * 6. there is no `UsageStatisticsLevel`;
 * 7. its value is not exactly `0`, `1`, `2` or `3`;
 * 8. otherwise the level is that value.
 *
 * @param input The browser's signals, the anchor and its settings
 */
export function resolveTelemetryGate(input: ITelemetryGateInput): ITelemetryGate {
  if (input.testerFlag === '1') return closed('tester-flag')
  if (input.globalPrivacyControl === true || input.doNotTrack === '1') {
    return closed('privacy-signal')
  }
  if (!input.hasAnchor) return closed('no-anchor')
  if (!input.anchorAvailable) return closed('anchor-unavailable')
  const catalogSetting = settingOf(input.settings, CATALOG_TELEMETRY_KEY)
  if (catalogSetting === '0') return closed('catalog-opt-out')
  const levelSetting = settingOf(input.settings, USAGE_STATISTICS_LEVEL_KEY)
  if (levelSetting === undefined) return closed('no-level')
  if (['0', '1', '2', '3'].indexOf(levelSetting) === -1) return closed('invalid-level')
  const level = Number(levelSetting) as TelemetryLevel
  return { level, catalog: level >= 2 && catalogSetting === '1', reason: 'setting' }
}

/**
 * Reads the browser's signals for the gate: the tester flag, which is the only thing telemetry
 * reads from storage, Global Privacy Control and Do Not Track. Storage that cannot be read counts
 * as the flag being set.
 */
export function readTelemetrySignals(): Pick<
  ITelemetryGateInput,
  'testerFlag' | 'globalPrivacyControl' | 'doNotTrack'
> {
  let testerFlag: unknown = '1'
  try {
    testerFlag = window.sessionStorage.getItem(DISABLE_TELEMETRY_FLAG)
  } catch {
    // A browser that blocks storage has said enough: the gate stays closed.
  }
  const browser: { globalPrivacyControl?: unknown; doNotTrack?: unknown } =
    typeof navigator === 'undefined' ? {} : navigator
  return {
    testerFlag,
    globalPrivacyControl: browser.globalPrivacyControl,
    doNotTrack: browser.doNotTrack
  }
}
