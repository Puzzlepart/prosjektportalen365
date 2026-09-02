import { Logger, LogLevel } from '@pnp/logging'
import { IWeb } from '@pnp/sp/webs'
import ProjectSetup from 'extensions/projectSetup'

/**
 * Delete customizer for the specified project setup instance.
 *
 * Best-effort: deleting a user custom action requires Full Control, so on sites
 * where the current user lacks that permission (e.g. a non-owner member on a
 * Teams channel site) the failure is logged and swallowed rather than surfaced
 * as an error dialog. The leftover custom action is cleaned up the next time an
 * owner visits.
 *
 * @param instance Project setup instance
 */
export async function deleteCustomizer(instance: ProjectSetup): Promise<void> {
  try {
    const web = instance.sp.web as IWeb
    const customActions = await web.userCustomActions<
      { Id: string; ClientSideComponentId: string }[]
    >()
    for (let i = 0; i < customActions.length; i++) {
      const customAction = customActions[i]
      if (customAction.ClientSideComponentId === instance.componentId) {
        Logger.log({
          message: `(ProjectSetup) [deleteCustomizer]: Deleting custom action ${customAction.Id}`,
          level: LogLevel.Info
        })
        await web.userCustomActions.getById(customAction.Id).delete()
        break
      }
    }
  } catch (error) {
    Logger.log({
      message: `(ProjectSetup) [deleteCustomizer]: Could not delete custom action (likely insufficient permissions); ignoring. ${
        error?.message ?? ''
      }`,
      level: LogLevel.Warning
    })
  }
}
