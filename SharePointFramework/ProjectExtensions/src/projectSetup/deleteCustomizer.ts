import { Logger, LogLevel } from '@pnp/logging'
import { Web } from '@pnp/sp'

/**
 * Delete customizer by componentId
 *
 * @param {string} webAbsoluteUrl Web absolute URL
 * @param {string} componentId Component ID
 * @param {boolean} reload Reload page after customizer removal
 */
export async function deleteCustomizer(
  webAbsoluteUrl: string,
  componentId: string,
  reload: boolean
): Promise<void> {
  const web = new Web(webAbsoluteUrl)
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
