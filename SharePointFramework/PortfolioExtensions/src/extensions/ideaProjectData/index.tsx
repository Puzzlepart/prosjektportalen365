import { override } from '@microsoft/decorators'
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters,
  RowAccessor
} from '@microsoft/sp-listview-extensibility'
import { SPFI, spfi, SPFx } from '@pnp/sp'
import '@pnp/sp/webs'
import '@pnp/sp/items'
import '@pnp/sp/lists'
import '@pnp/sp/site-groups/web'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import IdeaDialog from 'components/IdeaDialog'
import { isUserAuthorized } from '../../helpers/isUserAuthorized'
import strings from 'PortfolioExtensionsStrings'
import { IdeaConfigurationModel, SPIdeaConfigurationItem } from 'models'

enum RecommendationType {
  ApprovedSync = 'Godkjent og synkronisert',
  Approved = 'Godkjent for konseptutredning',
  Consideration = 'Under vurdering',
  Rejected = 'Avvist'
}

export interface IIdeaProjectDataCommandProperties {
  ideaId: number
}

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = LogLevel.Info

export default class IdeaProjectDataCommand extends BaseListViewCommandSet<IIdeaProjectDataCommandProperties> {
  private _userAuthorized: boolean
  private _openCmd: Command
  private _sp: SPFI
  private _ideaConfig: IdeaConfigurationModel

  @override
  public async onInit(): Promise<void> {
    Logger.log({
      message: '(IdeaProjectDataCommand) onInit: Initializing...',
      data: { version: this.context.manifest.version },
      level: LogLevel.Info
    })
    this._sp = spfi().using(SPFx(this.context))
    this._openCmd = this.tryGetCommand('OPEN_IDEA_PROJECTDATA_DIALOG')
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
  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    switch (event.itemId) {
      case this._openCmd.id:
        const dialog: IdeaDialog = new IdeaDialog()
        const row = event.selectedRows[0]

        dialog.ideaTitle = row.getValueByName('Title')
        dialog.dialogMessage =
          this._ideaConfig.description[2] ||
          strings.SetRecommendationDefaultDescription.split(';')[2]
        dialog.isApproved =
          row.getValueByName('GtIdeaDecision') === RecommendationType.Approved ||
          row.getValueByName('GtIdeaDecision') === RecommendationType.ApprovedSync
        dialog.isBlocked = !!row.getValueByName('GtIdeaProjectData')
        dialog.show()
        dialog.submit = this._onSubmit.bind(this, row)
        break
      default:
        throw new Error('Unknown command')
    }
  }

  /**
   * Get the idea configuration from the IdeaConfiguration list
   */
  private _getIdeaConfiguration = async (): Promise<IdeaConfigurationModel[]> => {
    const ideaConfig = await this._sp.web.lists
      .getByTitle(strings.IdeaConfigurationTitle)
      .select(...new SPIdeaConfigurationItem().fields)
      .items()

    return ideaConfig.map((item) => new IdeaConfigurationModel(item)).filter(Boolean)
  }

  /**
   * On ListView state changed, check if the user is authorized to use this command
   */
  private _onListViewStateChanged = async (): Promise<void> => {
    Logger.log({
      message: '(IdeaProjectDataCommand) onListViewStateChanged: ListView state changed',
      level: LogLevel.Info
    })

    const listName = this.context.pageContext.list.title
    const [ideaConfig] = (await this._getIdeaConfiguration()).filter(
      (item) => item.processingList === listName
    )
    this._ideaConfig = ideaConfig

    if (ideaConfig) {
      this._openCmd = this.tryGetCommand('OPEN_IDEA_PROJECTDATA_DIALOG')
      if (this._openCmd) {
        this._openCmd.visible =
          this.context.listView.selectedRows?.length === 1 &&
          this._userAuthorized &&
          ideaConfig.processingList === listName
      }
      this.raiseOnChange()
    }
  }

  /**
   * On submit fields will be updated,
   * - Creates a new item to 'ProsjektData' list
   *
   * @param row Selected row
   */
  private _onSubmit(row: RowAccessor) {
    const rowId = row.getValueByName('ID')
    const rowTitle = row.getValueByName('Title')
    this._redirectNewItem(rowId, rowTitle)
  }

  /**
   * Create new item, update selected item and send the user to the edit form for the new item
   *
   * @param rowId: ID of the selected row
   * @param rowTitle: Title of the selected row
   */
  private async _redirectNewItem(rowId: number, rowTitle: string) {
    const properties: Record<string, any> = {
      Title: rowTitle,
      GtProjectFinanceName: rowTitle
    }

    Logger.log({
      message: '(Item) _redirectNewItem: Created new item',
      data: { fieldValues: properties },
      level: LogLevel.Info
    })

    const item = await this._addItem(properties)
    await this._updateItem(rowId, item)
    document.location.hash = ''
    document.location.href = this.editFormUrl(item)
  }

  /**
   * Add item
   *
   * @param rowId: ID of the selected row
   * @param item: Item
   */
  public async _updateItem(rowId: number, item: any): Promise<any> {
    const list = this._sp.web.lists.getByTitle(this._ideaConfig.processingList)
    const itemUpdateResult = await list.items.getById(rowId).update({
      GtIdeaProjectDataId: item.Id
    })
    return itemUpdateResult.data
  }

  /**
   * Add item
   *
   * @param properties Properties
   */
  public async _addItem(properties: Record<string, any>): Promise<any> {
    const list = this._sp.web.lists.getByTitle(strings.IdeaProjectDataTitle)
    const itemAddResult = await list.items.add(properties)
    return itemAddResult.data
  }

  /**
   * Edit form URL with added Source parameter generated from the item ID
   *
   * @param item Item
   */
  public editFormUrl(item: any) {
    return [
      `${this.context.pageContext.web.absoluteUrl}`,
      `/Lists/${strings.IdeaProjectDataTitle}/EditForm.aspx`,
      '?ID=',
      item.Id,
      '&Source=',
      encodeURIComponent(window.location.href)
    ].join('')
  }
}
