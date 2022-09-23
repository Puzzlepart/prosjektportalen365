import { override } from '@microsoft/decorators'
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetListViewUpdatedParameters,
  IListViewCommandSetExecuteEventParameters,
  RowAccessor,
} from '@microsoft/sp-listview-extensibility'
import { SPFI, spfi, SPFx } from '@pnp/sp'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import '@pnp/sp/site-groups/web'
import DialogPrompt from './Components/Dialog'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = DEBUG ? LogLevel.Info : LogLevel.Warning

enum RecommendationType {
  Accepted = 'Godkjent for konseptutredning',
  Consideration = 'Under vurdering',
  Declined = 'Avvist',
}

export default class IdeaProcessCommand extends BaseListViewCommandSet<any> {
  private _userAuthorized: boolean
  private _sp: SPFI

  @override
  public async onInit(): Promise<void> {
    Logger.log({
      message: '(IdeaProcessCommand) onInit: Initializing...',
      data: { version: this.context.manifest.version },
      level: LogLevel.Info
    })
    this._sp = spfi().using(SPFx(this.context))
    this._userAuthorized = await this._isUserAuthorized()

    return Promise.resolve()
  }

  @override
  public onListViewUpdated(
    event: IListViewCommandSetListViewUpdatedParameters
  ){
    const compareOneCommand: Command = this.tryGetCommand(
      'RECOMMENDATION_COMMAND'
    )
    if (compareOneCommand) {
      // This command should be hidden unless exactly one row is selected.
      compareOneCommand.visible =
        event.selectedRows.length === 1 &&
      this._userAuthorized &&
        location.href.includes('Idebehandling')
    }
  }

  @override
  public onExecute(event: IListViewCommandSetExecuteEventParameters): any {
    switch (event.itemId) {
      case 'RECOMMENDATION_COMMAND':
        const dialog: DialogPrompt = new DialogPrompt()

        dialog.ideaTitle = event.selectedRows[0].getValueByName('Title')
        dialog.show().then(() => {
          if (dialog.comment && dialog.selectedChoice === 'Godkjenn') {
            this.onSubmit(
              event.selectedRows[0],
              dialog.comment,
              dialog.selectedChoice
            )
          } else if (
            dialog.comment &&
            dialog.selectedChoice === 'Under vurdering'
          ) {
            this.onSubmitConsideration(event.selectedRows[0], dialog.comment)
          } else if (dialog.comment && dialog.selectedChoice === 'Avvis') {
            this.onSubmitDeclined(event.selectedRows[0], dialog.comment)
          } else {
            Logger.log({ message: 'Declined', level: LogLevel.Info })
          }
        })
        break
      default:
        throw new Error('Unknown command')
    }
  }

  /**
   * On submit and declined
   */
  private onSubmitDeclined(selectedRow: RowAccessor, recComment: string) {
    const rowId = selectedRow.getValueByName('ID')
    this._sp.web.lists
      .getByTitle('Idébehandling')
      .items.getById(rowId)
      .update({
        GtIdeaDecision: RecommendationType.Declined,
        GtIdeaDecisionComment: recComment,
      })
      .then(() => console.log('Updated Idébehandling'))
  }

  /**
   * On submit and concideration
   */
  private onSubmitConsideration(
    selectedRow: RowAccessor,
    recComment: string
  ) {
    const rowId = selectedRow.getValueByName('ID')
    this._sp.web.lists
      .getByTitle('Idébehandling')
      .items.getById(rowId)
      .update({
        GtIdeaDecision: RecommendationType.Consideration,
        GtIdeaDecisionComment: recComment,
      })
      .then(() => console.log('Updated Idébehandling'))
  }

  /**
   * On submit and approved
   */
  private onSubmit(
    selectedRow: RowAccessor,
    recComment: string,
    recChoice: string
  ) {
    console.log(recChoice)
    const rowId = selectedRow.getValueByName('ID')
    this._sp.web.lists
      .getByTitle('Idébehandling')
      .items.getById(rowId)
      .update({
        GtIdeaDecision: RecommendationType.Accepted,
        GtIdeaDecisionComment: recComment,
      })
      .then(() => console.log('Updated Idébehandling'))
  }

  /**
   * Checks if the current user has premisions to set recommendation
   */
  private async _isUserAuthorized(): Promise<boolean> {
    const users = await this._sp.web.siteGroups.getByName('Idebehandlere').users()
    return users.some(
      (user: { Email: string }) => user.Email === this.context.pageContext.user.email
    )
  }
}
