import { Logger, LogLevel } from '@pnp/logging'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import '@pnp/sp/security'
import { getTermStore } from 'pp365-shared-library'
import { SPDataAdapterBase } from 'pp365-shared-library/lib/data'
import resource from 'SharedResources'

/** Reads installation metadata and checks Term Store reachability for the catalog. */
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
   * Checks Term Store read access before import or cloud-template publishing.
   * This does not prove write access: REST write probes can fail on OAuth-only
   * tenants even when the provisioner's JSOM authentication works.
   */
  public async hasTermStorePermission(): Promise<boolean> {
    try {
      await getTermStore(this.sp.web)()
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
