import { override } from '@microsoft/decorators'
import { Dialog } from '@microsoft/sp-dialog'
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters,
  RowAccessor
} from '@microsoft/sp-listview-extensibility'
import { SPFI, spfi, SPFx } from '@pnp/sp'
import '@pnp/sp/items'
import '@pnp/sp/lists'
import '@pnp/sp/site-groups/web'
import '@pnp/sp/webs'
import DialogPrompt from 'components/IdeaApprovalDialog'
import { Choice, IdeaConfigurationModel, SPIdeaConfigurationItem } from 'models'
import strings from 'PortfolioExtensionsStrings'
import { find } from 'underscore'
import { isUserAuthorized } from '../../helpers/isUserAuthorized'
import { themeColor } from 'pp365-shared-library'
import resource from 'SharedResources'

export default class IdeaProcessCommand extends BaseListViewCommandSet<any> {
  private _userAuthorized: boolean
  private _openCmd: Command
  private _sp: SPFI
  private _config: IdeaConfigurationModel

  @override
  public async onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context))
    this._openCmd = this.tryGetCommand('OPEN_IDEA_PROCESSING_DIALOG')

    this._openCmd.title = strings.IdeaProcessingCommandTitle

    const fillColor = themeColor
    const exportSvgCmd = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2048 2048'%3E%3Cpath d='M1024 0q141 0 272 36t244 104 207 160 161 207 103 245 37 272q0 141-36 272t-104 244-160 207-207 161-245 103-272 37q-141 0-272-36t-244-104-207-160-161-207-103-245-37-272q0-141 36-272t104-244 160-207 207-161T752 37t272-37zM907 1347q22 0 42-8t35-24l429-429q15-15 23-35t8-41q0-22-8-42t-23-34-35-23-42-9q-21 0-41 8t-36 23l-352 352-118-118q-32-32-77-32-22 0-42 8t-35 24-23 34-9 42q0 21 8 41t24 36l195 195q15 15 35 23t42 9z' fill='${fillColor.replace(
      '#',
      '%23'
    )}'%3E%3C/path%3E%3C/svg%3E`
    this._openCmd.iconImageUrl = exportSvgCmd

    this._openCmd.visible = false

    this._userAuthorized = await isUserAuthorized(
      this._sp,
      resource.Security_SiteGroup_IdeaProcessors_Title,
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
      .getByTitle(resource.Lists_Idea_Configuration_Title)
      .select(...new SPIdeaConfigurationItem().fields)
      .items()

    return config.map((item) => new IdeaConfigurationModel(item)).filter(Boolean)
  }

  /**
   * On ListView state changed, check if the user is authorized to use this command
   */
  private _onListViewStateChanged = async (): Promise<void> => {
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
  private _onSubmitRejected = async (row: RowAccessor, comment: string): Promise<void> => {
    const rowId = row.getValueByName('ID')
    await this._sp.web.lists
      .getByTitle(this._config.processingList)
      .items.getById(rowId)
      .update({
        GtIdeaDecision: find(this._config.processing, { key: Choice.Reject })?.recommendation,
        GtIdeaDecisionComment: comment
      })
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
