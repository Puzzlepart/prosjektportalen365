const SS_DISABLE_TAXONOMY = 'PP_DISABLE_TAXONOMY'
const SS_DISABLE_IMPORT = 'PP_DISABLE_IMPORT'
const SS_DISABLE_TELEMETRY = 'PP_DISABLE_TELEMETRY'
const SS_SHOW_HIDDEN = 'PP_SHOW_HIDDEN'
const QS_SHOW_HIDDEN = 'showHidden'

function readSessionFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

/**
 * Single source of truth for the catalog feature flags. The UI reads these
 * once (via props) and passes them down; it never re-reads the command-set
 * property independently.
 */
export const featureFlags = {
  /**
   * Whether the taxonomy/Term Store provisioning step runs during Mode A
   * import and Mode B publish-as-cloud-template. On by default —
   * `sp-js-provisioning` 1.3.12 ships a Term Store handler (registered in its
   * `DefaultHandlerMap`), so packages that bundle term sets provision them as
   * part of `applyTemplate`. Opt out per environment by setting the
   * command-set property `featureFlagProvisioning` to `false`, or in-session
   * via the `PP_DISABLE_TAXONOMY` flag.
   */
  enableTaxonomyProvisioning(props?: { featureFlagProvisioning?: boolean }): boolean {
    if (props?.featureFlagProvisioning === false) return false
    return !readSessionFlag(SS_DISABLE_TAXONOMY)
  },

  /**
   * Global pilot kill-switch for the whole import action (Mode A). Enabled by
   * default; set the `PP_DISABLE_IMPORT` session flag to disable during a
   * controlled rollout without a code change.
   */
  isImportEnabled(): boolean {
    return !readSessionFlag(SS_DISABLE_IMPORT)
  },

  /**
   * Whether catalog install-telemetry events are sent (see `TelemetryService`).
   * On by default; set the `PP_DISABLE_TELEMETRY` session flag to disable
   * in-session, or set the command-set property `telemetryUrl` to an empty
   * string to disable for the whole installation.
   */
  isTelemetryEnabled(): boolean {
    return !readSessionFlag(SS_DISABLE_TELEMETRY)
  },

  /**
   * Debug/QA: surface packages the catalog feed marks `hidden` (staged,
   * not-yet-released). Off by default. Enable by opening the list with
   * `?showHidden=true` in the URL — the value is persisted as the
   * `PP_SHOW_HIDDEN` session flag so it survives SharePoint's SPA navigation
   * (which drops query params) — or by setting the session flag directly.
   * `?showHidden=false` turns it off again; otherwise it lasts until the tab
   * closes.
   */
  showHiddenPackages(): boolean {
    try {
      // Case-insensitive key lookup — these URLs are hand-typed by testers.
      // NOTE: the command set calls this in onInit to persist the flag while
      // the URL still carries the param — modern SharePoint rewrites the
      // query string during SPA navigation, so reading it only when the
      // drawer opens would be too late.
      let value: string | undefined
      new URLSearchParams(window.location.search).forEach((paramValue, key) => {
        if (key.toLowerCase() === QS_SHOW_HIDDEN.toLowerCase()) {
          value = paramValue.toLowerCase()
        }
      })
      if (value === 'true' || value === '1') {
        sessionStorage.setItem(SS_SHOW_HIDDEN, '1')
      } else if (value === 'false' || value === '0') {
        sessionStorage.removeItem(SS_SHOW_HIDDEN)
      }
    } catch {
      // URL/sessionStorage unavailable — fall through to the session flag.
    }
    return readSessionFlag(SS_SHOW_HIDDEN)
  }
}
