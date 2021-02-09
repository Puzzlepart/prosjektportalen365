import { Logger, LogLevel } from '@pnp/logging'
import { Web } from '@pnp/sp'

/**
 * Delete customizer
 *
 * @param {string} componentId Component ID
 * @param {boolean} reload Reload page after customizer removal
 */
export async function deleteCustomizer(componentId: string, reload: boolean): Promise<void>{
  const web = new Web(this.context.pageContext.web.absoluteUrl)
  const customActions = await web.userCustomActions.get<
    { Id: string; ClientSideComponentId: string }[]
  >()
  for (let i = 0; i < customActions.length; i++) {
    const customAction = customActions[i]
    if (customAction.ClientSideComponentId === componentId) {
      Logger.log({
        message: `(ProjectSetup) [_deleteCustomizer]: Deleting custom action ${customAction.Id}`,
        level: LogLevel.Info
      })
      await web.userCustomActions.getById(customAction.Id).delete()
      break
    }
  }
  if (reload) {
    window.location.href = window.location.href
  }
}