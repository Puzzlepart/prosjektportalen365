import { override } from '@microsoft/decorators'
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters,
} from '@microsoft/sp-listview-extensibility'
import { spfi, SPFx } from '@pnp/sp'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/site-groups/web'

import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import IdeaDialog from 'components/IdeaDialog'
import { isUserAuthorized } from 'helpers/isUserAuthorized'
import strings from 'PortfolioExtensionsStrings'

export interface IIdeaProjectDataCommandProperties {
  ideaId: number
}

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = LogLevel.Info

export default class IdeaProjectDataCommand extends BaseListViewCommandSet<IIdeaProjectDataCommandProperties> {
  private _userAuthorized: boolean
  private _openCmd: Command

  @override
  public async onInit(): Promise<void> {
    Logger.log({
      message: '(IdeaProjectDataCommand) onInit: Initializing...',
      data: { version: this.context.manifest.version },
      level: LogLevel.Info
    })
    const sp = spfi().using(SPFx(this.context))
    this._openCmd = this.tryGetCommand('OPEN_IDEA_PROJECTDATA_DIALOG')
    this._openCmd.visible = false
    this._userAuthorized = await isUserAuthorized(sp, strings.IdeaProcessorsSiteGroup)
    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged)
    return Promise.resolve()
  }

  @override
  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    switch (event.itemId) {
      case this._openCmd.id:
        // const ideaId = event.selectedRows[0].getValueByName('ID')
        // const ideaTitle = event.selectedRows[0].getValueByName('Title')
        // const ideaUrl = `${this.context.pageContext.web.absoluteUrl}/Lists/Idebehandling/NewForm.aspx?Title=${ideaTitle}`
        // window.open(ideaUrl, '_blank')
        const dialog: IdeaDialog = new IdeaDialog()

        dialog.ideaTitle = event.selectedRows[0].getValueByName('Title')
        dialog.show()
        break
      default:
        throw new Error('Unknown command')
    }
  }

  private _onListViewStateChanged = (): void => {
    Logger.log({
      message: '(IdeaProjectDataCommand) onListViewStateChanged: ListView state changed',
      level: LogLevel.Info
    })
    
    this._openCmd = this.tryGetCommand('OPEN_IDEA_PROJECTDATA_DIALOG')
    if (this._openCmd) {
      this._openCmd.visible = this.context.listView.selectedRows?.length === 1 &&
        this._userAuthorized &&
        location.href.includes(strings.IdeaProcessingUrlTitle)
    }
    this.raiseOnChange()
  }
}
