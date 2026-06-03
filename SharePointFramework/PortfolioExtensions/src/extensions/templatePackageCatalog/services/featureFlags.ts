import { ITemplatePackageCatalogCommandProperties } from '../types'

const SS_ENABLE_TAXONOMY = 'PP_ENABLE_TAXONOMY'
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
   * import. Off by default everywhere — `sp-js-provisioning` 1.3.7 has no
   * Term Store handler. Flip on (via the command-set property or the
   * `PP_ENABLE_TAXONOMY` session flag) once the out-of-repo handler ships.
   */
  enableTaxonomyProvisioning(props?: ITemplatePackageCatalogCommandProperties): boolean {
    return readSessionFlag(SS_ENABLE_TAXONOMY) || !!props?.featureFlagProvisioning
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
