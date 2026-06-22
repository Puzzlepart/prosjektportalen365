import { Logger, LogLevel } from '@pnp/logging'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import '@pnp/sp/security'
import '@pnp/sp/taxonomy'
import { SPDataAdapterBase } from 'pp365-shared-library/lib/data'
import resource from 'SharedResources'

class SPDataAdapter extends SPDataAdapterBase {
  /**
   * Read the installed Prosjektportalen version from the latest Installation
   * Log item (`InstallVersion`). Used for the Mode A `minPPVersion` check.
   *
   * Returns `null` when unavailable — callers should then treat the version
   * check as "allow with warning" rather than hard-blocking the import.
   */
  public async getInstalledPPVersion(): Promise<string | null> {
    try {
      const items = await this.sp.web.lists
        .getByTitle(resource.Lists_InstallationLog_Title)
        .items.select('InstallVersion')
        .orderBy('Id', false)
        .top(1)()
      return items[0]?.InstallVersion ?? null
    } catch (error) {
      Logger.log({
        message: `(SPDataAdapter) getInstalledPPVersion failed: ${error?.message}`,
        level: LogLevel.Warning
      })
      return null
    }
  }

  /**
   * Best-effort Term Store reachability check, used to pre-gate the taxonomy
   * provisioning step in Mode A. Returns `true` when the tenant Term Store can
   * be read by the current user.
   *
   * This is intentionally a **read** check. A write probe via the REST term
   * store API (`POST /_api/v2.1/termstore/groups`) is rejected on tenants with
   * "OAuth only" / app-only enforcement (`403 — OAuth only flow is enabled and
   * the call has not been issued from an app`) and would give false negatives,
   * because the actual taxonomy provisioning runs over **JSOM** (a different
   * auth path that isn't subject to that restriction). True write capability is
   * therefore enforced by the provisioning step itself: the Taxonomy handler
   * runs first, so a permission failure fails fast and surfaces as a retryable
   * install error rather than a partially provisioned package.
   */
  public async hasTermStorePermission(): Promise<boolean> {
    try {
      await this.sp.termStore()
      return true
    } catch (error) {
      Logger.log({
        message: `(SPDataAdapter) hasTermStorePermission failed: ${error?.message}`,
        level: LogLevel.Warning
      })
      return false
    }
  }
}

export default new SPDataAdapter()
