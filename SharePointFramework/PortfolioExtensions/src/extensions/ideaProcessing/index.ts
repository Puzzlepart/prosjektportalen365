import { override } from '@microsoft/decorators'
import { Log } from '@microsoft/sp-core-library'
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters,
  RowAccessor
} from '@microsoft/sp-listview-extensibility'
import { Dialog } from '@microsoft/sp-dialog'
import { SPFI, spfi, SPFx } from '@pnp/sp'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import '@pnp/sp/site-groups/web'
import DialogPrompt from 'components/IdeaApprovalDialog'
import strings from 'PortfolioExtensionsStrings'
import { Choice, IdeaConfigurationModel, SPIdeaConfigurationItem } from 'models'
import { isUserAuthorized } from '../../helpers/isUserAuthorized'
import { find } from 'underscore'

const LOG_SOURCE: string = 'IdeaProcessingCommand'

export default class IdeaProcessCommand extends BaseListViewCommandSet<any> {
  private _userAuthorized: boolean
  private _openCmd: Command
  private _sp: SPFI
  private _config: IdeaConfigurationModel

  @override
  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'onInit: Initializing...')
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

  public onExecute = async (event: IListViewCommandSetExecuteEventParameters): Promise<void> => {
    switch (event.itemId) {
      case this._openCmd.id:
        const dialog: DialogPrompt = new DialogPrompt()
        const row = event.selectedRows[0]

        dialog.ideaTitle = row.getValueByName('Title')
        dialog.dialogMessage = this._config.description.processing
        dialog.choices = this._config.processing
        await dialog.show()

        if (dialog.comment) {
          const selectedChoice = find(this._config.processing, {
            choice: dialog.selectedChoice
          })?.key

          if (selectedChoice) {
            if (this._isIdeaRecommended(row)) {
              Dialog.alert(strings.IdeaAlreadyApproved)
            } else {
              switch (selectedChoice) {
                case Choice.Approve:
                  this._onSubmit(row, dialog.comment)
                  break
                case Choice.Consideration:
                  this._onSubmitConsideration(row, dialog.comment)
                  break
                case Choice.Reject:
                  this._onSubmitRejected(row, dialog.comment)
                  break
                default:
                  this._onSubmitOther(row, dialog.comment, dialog.selectedChoice)
                  break
              }
            }
          }
        }
        break
      default:
        throw new Error('Unknown command, unable to execute')
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
    Log.info(LOG_SOURCE, 'onListViewStateChanged: ListView state changed')

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
    } else {
      Log.info(
        LOG_SOURCE,
        'onListViewStateChanged: You are currently not authorized to use this command or the list is not configured for this command'
      )
    }
  }

  /**
   * On submit and rejected
   *
   * @param row Selected row
   * @param comment Comment
   */
  private _onSubmitRejected = async (row: RowAccessor, comment: string): Promise<void> => {
    const rowId = row.getValueByName('ID')
    await this._sp.web.lists
      .getByTitle(this._config.processingList)
      .items.getById(rowId)
      .update({
        GtIdeaDecision: find(this._config.processing, { key: Choice.Reject })?.recommendation,
        GtIdeaDecisionComment: comment
      })

    Log.info(LOG_SOURCE, `Updated ${this._config.processingList}: Rejected`)
    window.location.reload()
  }

  /**
   * On submit and concideration
   *
   * @param row Selected row
   * @param comment Comment
   */
  private _onSubmitConsideration = async (row: RowAccessor, comment: string): Promise<void> => {
    const rowId = row.getValueByName('ID')
    await this._sp.web.lists
      .getByTitle(this._config.processingList)
      .items.getById(rowId)
      .update({
        GtIdeaDecision: find(this._config.processing, { key: Choice.Consideration })
          ?.recommendation,
        GtIdeaDecisionComment: comment
      })

    Log.info(LOG_SOURCE, `Updated ${this._config.processingList}: Consideration`)
    window.location.reload()
  }

  /**
   * On submit and approved
   *
   * @param row Selected row
   * @param comment Comment
   */
  private _onSubmit = async (row: RowAccessor, comment: string): Promise<void> => {
    const rowId = row.getValueByName('ID')
    await this._sp.web.lists
      .getByTitle(this._config.processingList)
      .items.getById(rowId)
      .update({
        GtIdeaDecision: find(this._config.processing, { key: Choice.Approve })?.recommendation,
        GtIdeaDecisionComment: comment
      })

    Log.info(LOG_SOURCE, `Updated ${this._config.processingList}: Approved`)
    window.location.reload()
  }

  /**
   * On submit and other
   *
   * @param row Selected row
   * @param comment Comment
   */
  private _onSubmitOther = async (
    row: RowAccessor,
    comment: string,
    selectedChoice: string
  ): Promise<void> => {
    const rowId = row.getValueByName('ID')
    await this._sp.web.lists
      .getByTitle(this._config.processingList)
      .items.getById(rowId)
      .update({
        GtIdeaDecision: find(this._config.processing, { choice: selectedChoice })?.recommendation,
        GtIdeaDecisionComment: comment
      })

    Log.info(LOG_SOURCE, `Updated ${this._config.processingList}: Other`)
    window.location.reload()
  }

  /**
   * Returns true if the idea is already recommended
   *
   * @param row Selected row
   */
  private _isIdeaRecommended = (row: RowAccessor): boolean => {
    return (
      row.getValueByName('GtIdeaDecision') ===
      find(this._config.processing, { key: Choice.Approve })?.recommendation
    )
  }
}
