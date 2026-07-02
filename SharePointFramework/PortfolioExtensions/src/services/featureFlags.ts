const SS_DISABLE_TAXONOMY = 'PP_DISABLE_TAXONOMY'
const SS_DISABLE_IMPORT = 'PP_DISABLE_IMPORT'

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
   * import. On by default — `sp-js-provisioning` 1.3.12 ships a Term Store
   * handler (registered in its `DefaultHandlerMap`), so packages that bundle
   * term sets provision them as part of `applyTemplate`. Opt out per
   * environment by setting the command-set property `featureFlagProvisioning`
   * to `false`, or in-session via the `PP_DISABLE_TAXONOMY` flag.
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
  }
}
