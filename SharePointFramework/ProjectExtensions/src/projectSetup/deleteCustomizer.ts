import { Logger, LogLevel } from '@pnp/logging'
import { IWeb } from '@pnp/sp/webs'
import ProjectSetup from 'projectSetup'

/**
 * Delete customizer for the specified project setup instance.
 *
 * @param instance Project setup instance
 * @param reloadAfterRemoval Reload page after the customizer has been removed from the web
 */
export async function deleteCustomizer(
  instance: ProjectSetup,
  reloadAfterRemoval: boolean
): Promise<void> {
  const web = instance.sp.web as IWeb
  const customActions = await web.userCustomActions<
    { Id: string; ClientSideComponentId: string }[]
  >()
  for (let i = 0; i < customActions.length; i++) {
    const customAction = customActions[i]
    if (customAction.ClientSideComponentId === instance.componentId) {
      Logger.log({
        message: `(ProjectSetup) [_deleteCustomizer]: Deleting custom action ${customAction.Id}`,
        level: LogLevel.Info
      })
      await web.userCustomActions.getById(customAction.Id).delete()
      break
    }
  }
  if (reloadAfterRemoval) {
    window.location.href = window.location.href
  }
}
