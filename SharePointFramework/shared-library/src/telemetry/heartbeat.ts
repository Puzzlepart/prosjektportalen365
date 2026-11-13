import { TelemetryHubLanguage } from './contract'
import { currentTelemetryDecision, isTelemetryLevelClosed, ITelemetryStore } from './store'
import { sanitizeHeartbeat, TelemetryHeartbeatInput, TelemetryUsageSnapshot } from './validate'

/** The LCID of Norwegian Bokmål. */
const LCID_NB_NO = 1044

/** The LCID of English (United States). */
const LCID_EN_US = 1033

/** What was read of the hub for a heartbeat, before any of it is checked against the contract. */
export interface ITelemetryUsageRead {
  /** `InstallChannel` of the newest row of Installasjonslogg */
  channel?: unknown
  /** `InstallVersion` of that row, with or without a build hash after its three parts */
  templateVersion?: unknown
  /** The number of rows in Prosjekter */
  projects?: unknown
  /** The number of those rows that are programs */
  programs?: unknown
  /** The number of those rows that are parent projects */
  parentProjects?: unknown
}

/** Swallows a rejection: a heartbeat that cannot be read is not sent, and nothing else follows. */
function ignore(): void {
  return undefined
}

/**
 * The hub web's language as a heartbeat names it, from the web's LCID
 * (`pageContext.web.language` on a hub page): Norwegian Bokmål, English (United States) or
 * `other`. It is the hub's language, never a user's.
 *
 * @param lcid The LCID of the hub web
 */
export function hubLanguageFromLcid(lcid: unknown): TelemetryHubLanguage {
  const language = Number(lcid)
  if (language === LCID_NB_NO) return 'nb-NO'
  return language === LCID_EN_US ? 'en-US' : 'other'
}

/**
 * The hub's installation facts as a heartbeat carries them, from what was read of the hub. Only
 * values of the contract are kept: a channel it does not know becomes `unknown`, the version is
 * cut to its three parts, so the build hash after them goes no further, and a count that is not
 * one is left out, as a count whose read failed is.
 *
 * @param read What was read of the hub
 */
export function toUsageSnapshot(read: ITelemetryUsageRead): TelemetryUsageSnapshot {
  const snapshot: Partial<TelemetryHeartbeatInput> = sanitizeHeartbeat({
    ...read,
    hubLanguage: 'other'
  } as TelemetryHeartbeatInput)
  delete snapshot.hubLanguage
  return snapshot as TelemetryUsageSnapshot
}

/**
 * Reads the hub's installation facts and sends the heartbeat the Footer has asked for
 * (`requestHeartbeat`), once the gate has resolved at level 1 or higher for the page's hub. Until
 * then the request waits, so a hub at level 0 pays for no read. The read goes through the anchor,
 * as the settings do, at most once per page load, and never from a flush: it runs when the
 * heartbeat is asked for and when the gate decides.
 *
 * The heartbeat is taken on a hub page from a user who may manage the hub. A read that fails, or
 * a portal that cannot read the facts, sends none. One that answers after the page has moved to
 * another hub, or after the level was closed, is dropped.
 *
 * @param store The window's store
 * @param now The time
 * @param flush Sends what is in memory at once
 */
export function ensureTelemetryHeartbeat(
  store: ITelemetryStore,
  now: number,
  flush: () => void
): void {
  const { heartbeatRequest: hubLanguage, anchor, page } = store
  const decision = currentTelemetryDecision(store, now)
  if (!hubLanguage || !decision || decision.level < 1) return
  if (!page.isHubPage || !page.canManageHub) return
  store.heartbeatRequest = undefined
  store.heartbeatQueued = true
  if (typeof anchor.portal.getUsageSnapshot !== 'function') return
  Promise.resolve()
    .then(() => anchor.portal.getUsageSnapshot())
    .then((snapshot) => {
      if (!snapshot || store.anchor !== anchor || isTelemetryLevelClosed(store, 1)) return
      store.heartbeat = sanitizeHeartbeat({ ...snapshot, hubLanguage })
      flush()
    })
    .catch(ignore)
}
