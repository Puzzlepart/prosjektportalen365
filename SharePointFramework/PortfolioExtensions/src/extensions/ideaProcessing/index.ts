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
import { isUserAuthorized } from 'helpers/isUserAuthorized'
import strings from 'PortfolioExtensionsStrings'
import { IdeaConfigurationModel, SPIdeaConfigurationItem } from 'models'

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = DEBUG ? LogLevel.Info : LogLevel.Warning

enum RecommendationType {
  ApprovedSync = 'Godkjent og synkronisert',
  Approved = 'Godkjent for konseptutredning',
  Consideration = 'Under vurdering',
  Rejected = 'Avvist'
}

export default class IdeaProcessCommand extends BaseListViewCommandSet<any> {
  private _userAuthorized: boolean
  private _openCmd: Command
  private _sp: SPFI
  private _ideaConfig: IdeaConfigurationModel

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
        dialog.dialogDescription = this._ideaConfig.description || strings.SetRecommendationDefaultDescription
        dialog.show().then(() => {
          if (dialog.comment && dialog.selectedChoice === strings.ApproveChoice) {
            this._onSubmit(row, dialog.comment)
          } else if (dialog.comment && dialog.selectedChoice === strings.ConsiderationChoice) {
            this._onSubmitConsideration(row, dialog.comment)
          } else if (dialog.comment && dialog.selectedChoice === strings.RejectChoice) {
            this._onSubmitRejected(row, dialog.comment)
          } else {
            Logger.log({ message: 'Rejected', level: LogLevel.Info })
          }
        })
        break
      default:
        throw new Error('Unknown command')
    }
  }

  private _getIdeaConfiguration = async (): Promise<IdeaConfigurationModel[]> => {
    const ideaConfig = await this._sp.web.lists
      .getByTitle(strings.IdeaConfigurationTitle)
      .select(...new SPIdeaConfigurationItem().fields).items()

    return ideaConfig.map((item) => new IdeaConfigurationModel(item)).filter(Boolean)
  }

  private _onListViewStateChanged = async (): Promise<void> => {
    Logger.log({
      message: '(IdeaProcessCommand) onListViewStateChanged: ListView state changed',
      level: LogLevel.Info
    })

    const listName = this.context.pageContext.list.title
    const [ideaConfig] = (await this._getIdeaConfiguration()).filter((item) => item.processingList === listName)
    this._ideaConfig = ideaConfig

    if (ideaConfig) {
      this._openCmd = this.tryGetCommand('OPEN_IDEA_PROCESSING_DIALOG')
      if (this._openCmd) {
        this._openCmd.visible =
          this.context.listView.selectedRows?.length === 1 &&
          this._userAuthorized && ideaConfig.processingList === listName
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
  private _onSubmitRejected(row: RowAccessor, comment: string) {
    const rowId = row.getValueByName('ID')
    this._sp.web.lists
      .getByTitle(this._ideaConfig.processingList)
      .items.getById(rowId)
      .update({
        GtIdeaDecision: RecommendationType.Rejected,
        GtIdeaDecisionComment: comment
      })
      .then(() => Logger.log({ message: 'Updated Idébehandling', level: LogLevel.Info }))
  }

  /**
   * On submit and concideration
   *
   * @param row Selected row
   * @param comment Comment
   */
  private _onSubmitConsideration(row: RowAccessor, comment: string) {
    const rowId = row.getValueByName('ID')
    this._sp.web.lists
      .getByTitle(this._ideaConfig.processingList)
      .items.getById(rowId)
      .update({
        GtIdeaDecision: RecommendationType.Consideration,
        GtIdeaDecisionComment: comment
      })
      .then(() => Logger.log({ message: 'Updated Idébehandling', level: LogLevel.Info }))
  }

  /**
   * On submit and approved
   *
   * @param row Selected row
   * @param comment Comment
   */
  private _onSubmit(row: RowAccessor, comment: string) {
    const rowId = row.getValueByName('ID')
    this._sp.web.lists
      .getByTitle(this._ideaConfig.processingList)
      .items.getById(rowId)
      .update({
        GtIdeaDecision: RecommendationType.Approved,
        GtIdeaDecisionComment: comment
      })
      .then(() => Logger.log({ message: 'Updated Idébehandling', level: LogLevel.Info }))
  }
}
