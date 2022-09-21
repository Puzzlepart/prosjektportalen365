import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters,
} from '@microsoft/sp-listview-extensibility'
import { Dialog } from '@microsoft/sp-dialog'
import { SPFI, spfi, SPFx } from '@pnp/sp'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/site-groups/web'

import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'

export interface IIdeaProjectDataCommandProperties {
  ideaId: number
}

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = LogLevel.Info

export default class IdeaProjectDataCommand extends BaseListViewCommandSet<IIdeaProjectDataCommandProperties> {
  private _userAuthorized: boolean
  private _openCmd: Command

  public async onInit(): Promise<void> {
    Logger.log({
      message: '(IdeaProjectDataCommand) onInit: Initializing...',
      data: { version: this.context.manifest.version },
      level: LogLevel.Info
    })
    const sp = spfi().using(SPFx(this.context))
    this._openCmd = this.tryGetCommand('OPEN_IDEA_PROJECTDATA_DIALOG')
    this._openCmd.visible = false
    this._userAuthorized = await this._isUserAuthorized(sp)
    console.log(this._isUserAuthorized)

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged)

    return Promise.resolve()
  }

  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    switch (event.itemId) {
      case this._openCmd.id:
        // const ideaId = event.selectedRows[0].getValueByName('ID')
        // const ideaTitle = event.selectedRows[0].getValueByName('Title')
        // const ideaUrl = `${this.context.pageContext.web.absoluteUrl}/Lists/Idebehandling%20pnp/NewForm.aspx?IdeaId=${ideaId}&IdeaTitle=${ideaTitle}`
        // window.open(ideaUrl, '_blank')
        
        Dialog.alert('OPEN_IDEA_PROJECTDATA_DIALOG').catch(() => {
          /* handle error */
        })
        break
      default:
        throw new Error('Unknown command')
    }
  }

  private _onListViewStateChanged = (): void => {
    Logger.log({
      message: '(IdeaProjectDataCommand) onListViewStateChanged: ListView state changed',
      data: { version: this.context.manifest.version },
      level: LogLevel.Info
    })
    
    this._openCmd = this.tryGetCommand('OPEN_IDEA_PROJECTDATA_DIALOG')
    if (this._openCmd) {
      this._openCmd.visible = this.context.listView.selectedRows?.length === 1 &&
        this._userAuthorized &&
        location.href.includes('Idebehandling')
    }

    // TODO: Add your logic here

    // You should call this.raiseOnChage() to update the command bar
    this.raiseOnChange()
  }

  /**
   * Checks if the current user has premisions to access the command
   */
  private async _isUserAuthorized(sp: SPFI): Promise<boolean> {
    const users = await sp.web.siteGroups.getByName('Idebehandlere').users()
    return users.some(
      (user: { Email: string }) => user.Email === this.context.pageContext.user.email
    )
  }
}
