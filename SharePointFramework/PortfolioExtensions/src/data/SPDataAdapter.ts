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
   * Whether the current user can both **read and write** the tenant Term Store,
   * used to pre-gate the taxonomy provisioning step in Mode A.
   *
   * Reachability (a read) alone doesn't prove a user can provision term
   * groups/sets — a read-only user would otherwise pass this gate and then fail
   * mid-provision, leaving a partially installed package. So this also performs
   * a non-destructive write probe: it creates a uniquely-named throwaway term
   * group and immediately deletes it. It only runs right before a
   * taxonomy-bearing import (whose next step writes to the store anyway), so the
   * transient group is consistent with the operation. A false negative is
   * recoverable via the `featureFlagProvisioning`/`PP_DISABLE_TAXONOMY` opt-out.
   *
   * Returns `false` on any failure (no read access, no write access, or the
   * probe threw).
   */
  public async hasTermStorePermission(): Promise<boolean> {
    try {
      // Read check — the store must at least be reachable.
      await this.sp.termStore()
    } catch (error) {
      Logger.log({
        message: `(SPDataAdapter) hasTermStorePermission read check failed: ${error?.message}`,
        level: LogLevel.Warning
      })
      return false
    }

    // Write check — create then delete a throwaway group.
    const probeName = `__pp365_writecheck_${Date.now()}_${Math.round(Math.random() * 1e6)}`
    let createdGroupId: string | undefined
    try {
      const group = await this.sp.termStore.groups.add({ name: probeName, scope: 'global' })
      createdGroupId = group.id
      return true
    } catch (error) {
      Logger.log({
        message: `(SPDataAdapter) hasTermStorePermission write check failed: ${error?.message}`,
        level: LogLevel.Warning
      })
      return false
    } finally {
      if (createdGroupId) {
        try {
          await this.sp.termStore.groups.getById(createdGroupId).delete()
        } catch (error) {
          Logger.log({
            message: `(SPDataAdapter) hasTermStorePermission could not clean up probe group ${createdGroupId}: ${error?.message}`,
            level: LogLevel.Warning
          })
        }
      }
    }
  }
}

export default new SPDataAdapter()
