import { override } from '@microsoft/decorators'
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters,
  RowAccessor
} from '@microsoft/sp-listview-extensibility'
import { SPFI, spfi, SPFx } from '@pnp/sp'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import '@pnp/sp/site-groups/web'
import DialogPrompt from 'components/IdeaApprovalDialog'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import strings from 'PortfolioExtensionsStrings'
import { Choice, IdeaConfigurationModel, SPIdeaConfigurationItem } from 'models'
import { isUserAuthorized } from '../../helpers/isUserAuthorized'
import { find } from 'underscore'

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = DEBUG ? LogLevel.Info : LogLevel.Warning

export default class IdeaProcessCommand extends BaseListViewCommandSet<any> {
  private _userAuthorized: boolean
  private _openCmd: Command
  private _sp: SPFI
  private _config: IdeaConfigurationModel

  @override
  public async onInit(): Promise<void> {
    Logger.log({
      message: '(IdeaProcessCommand) onInit: Initializing...',
      data: { version: this.context.manifest.version },
      level: LogLevel.Info
    })

    this._sp = spfi().using(SPFx(this.context))
    this._openCmd = this.tryGetCommand('OPEN_IDEA_PROCESSING_DIALOG')
    this._openCmd.visible = false
    this._userAuthorized = await isUserAuthorized(
      this._sp,
      strings.IdeaProcessorsSiteGroup,
      this.context
    )
    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged)
    return Promise.resolve()
  }

  @override
  public onExecute(event: IListViewCommandSetExecuteEventParameters): any {
    switch (event.itemId) {
      case this._openCmd.id:
        const dialog: DialogPrompt = new DialogPrompt()
        const row = event.selectedRows[0]

        dialog.ideaTitle = row.getValueByName('Title')
        dialog.dialogMessage = this._config.description.processing
        dialog.choices = this._config.processing
        dialog.show().then(() => {
          const { comment, selectedChoice } = dialog
          const { processing } = this._config

          if (comment && selectedChoice === find(processing, { key: Choice.Approve })?.choice) {
            this._onSubmit(row, comment)
          } else if (
            comment &&
            selectedChoice === find(processing, { key: Choice.Consideration })?.choice
          ) {
            this._onSubmitConsideration(row, comment)
          } else if (
            comment &&
            selectedChoice === find(processing, { key: Choice.Reject })?.choice
          ) {
            this._onSubmitRejected(row, comment)
          } else {
            Logger.log({ message: 'Rejected', level: LogLevel.Info })
          }
        })
        break
      default:
        throw new Error('Unknown command')
    }
  }

  /**
   * Get the idea configuration from the IdeaConfiguration list
   */
  private _getIdeaConfiguration = async (): Promise<IdeaConfigurationModel[]> => {
    const config = await this._sp.web.lists
      .getByTitle(strings.IdeaConfigurationTitle)
      .select(...new SPIdeaConfigurationItem().fields)
      .items()

    return config.map((item) => new IdeaConfigurationModel(item)).filter(Boolean)
  }

  /**
   * On ListView state changed, check if the user is authorized to use this command
   */
  private _onListViewStateChanged = async (): Promise<void> => {
    Logger.log({
      message: '(IdeaProcessCommand) onListViewStateChanged: ListView state changed',
      level: LogLevel.Info
    })

    const listName = this.context.pageContext.list.title
    const [config] = (await this._getIdeaConfiguration()).filter(
      (item) => item.processingList === listName
    )
    this._config = config

    if (config) {
      this._openCmd = this.tryGetCommand('OPEN_IDEA_PROCESSING_DIALOG')
      if (this._openCmd) {
        this._openCmd.visible =
          this.context.listView.selectedRows?.length === 1 &&
          this._userAuthorized &&
          config.processingList === listName
      }
      this.raiseOnChange()
    }
  }

  /**
   * On submit and rejected
   *
   * @param row Selected row
   * @param comment Comment
   */
  private _onSubmitRejected = (row: RowAccessor, comment: string) => {
    const rowId = row.getValueByName('ID')
    this._sp.web.lists
      .getByTitle(this._config.processingList)
      .items.getById(rowId)
      .update({
        GtIdeaDecision: find(this._config.processing, { key: Choice.Reject })?.recommendation,
        GtIdeaDecisionComment: comment
      })
      .then(() => {
        Logger.log({ message: 'Updated Idébehandling', level: LogLevel.Info })
        window.location.reload()
      })
  }
  /**
   * On submit and concideration
   *
   * @param row Selected row
   * @param comment Comment
   */
  private _onSubmitConsideration = (row: RowAccessor, comment: string) => {
    const rowId = row.getValueByName('ID')
    this._sp.web.lists
      .getByTitle(this._config.processingList)
      .items.getById(rowId)
      .update({
        GtIdeaDecision: find(this._config.processing, { key: Choice.Consideration })
          ?.recommendation,
        GtIdeaDecisionComment: comment
      })
      .then(() => {
        Logger.log({ message: 'Updated Idébehandling', level: LogLevel.Info })
        window.location.reload()
      })
  }

  /**
   * On submit and approved
   *
   * @param row Selected row
   * @param comment Comment
   */
  private _onSubmit = (row: RowAccessor, comment: string) => {
    const rowId = row.getValueByName('ID')
    this._sp.web.lists
      .getByTitle(this._config.processingList)
      .items.getById(rowId)
      .update({
        GtIdeaDecision: find(this._config.processing, { key: Choice.Approve })?.recommendation,
        GtIdeaDecisionComment: comment
      })
      .then(() => {
        Logger.log({ message: 'Updated Idébehandling', level: LogLevel.Info })
        window.location.reload()
      })
  }
}
