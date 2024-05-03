import { override } from '@microsoft/decorators'
import { Log } from '@microsoft/sp-core-library'
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
import IdeaDialog from 'components/IdeaDialog'
import { isUserAuthorized } from '../../helpers/isUserAuthorized'
import strings from 'PortfolioExtensionsStrings'
import { Choice, IdeaConfigurationModel, SPIdeaConfigurationItem } from 'models'
import { find } from 'underscore'

export interface IIdeaProjectDataCommandProperties {
  ideaId: number
}

const LOG_SOURCE: string = 'IdeaProjectDataCommand'

export default class IdeaProjectDataCommand extends BaseListViewCommandSet<IIdeaProjectDataCommandProperties> {
  private _userAuthorized: boolean
  private _openCmd: Command
  private _sp: SPFI
  private _config: IdeaConfigurationModel

  @override
  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'onInit: Initializing...')
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
  public onExecute(event: IListViewCommandSetExecuteEventParameters) {
    switch (event.itemId) {
      case this._openCmd.id:
        const dialog: IdeaDialog = new IdeaDialog()
        const row = event.selectedRows[0]

        dialog.ideaTitle = row.getValueByName('Title')
        dialog.dialogMessage = this._config.description.projectData
        dialog.isApproved =
          row.getValueByName('GtIdeaDecision') ===
            find(this._config.processing, { key: Choice.Approve }).recommendation ||
          row.getValueByName('GtIdeaDecision') === strings.ApprovedSyncText
        dialog.isBlocked = !!row.getValueByName('GtIdeaProjectData')
        dialog.show()
        dialog.submit = this._onSubmit.bind(this, row)
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
      this._openCmd = this.tryGetCommand('OPEN_IDEA_PROJECTDATA_DIALOG')
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
   * On submit fields will be updated,
   * - Creates a new item to 'ProsjektData' list
   *
   * @param row Selected row
   */
  private _onSubmit = async (row: RowAccessor) => {
    const rowId = row.getValueByName('ID')
    const rowTitle = row.getValueByName('Title')
    await this._redirectNewItem(rowId, rowTitle)
  }

  /**
   * Create new item, update selected item and send the user to the edit form for the new item
   *
   * @param rowId: ID of the selected row
   * @param rowTitle: Title of the selected row
   */
  private _redirectNewItem = async (rowId: number, rowTitle: string): Promise<void> => {
    const properties: Record<string, any> = {
      Title: rowTitle,
      GtProjectFinanceName: rowTitle
    }

    Log.info(LOG_SOURCE, '_redirectNewItem: Created new item')
    const item = await this._addItem(properties)
    await this._updateItem(rowId, item)
    document.location.hash = ''
    document.location.href = this.editFormUrl(item)
  }

  /**
   * Update item
   *
   * @param rowId: ID of the selected row
   * @param item: Item
   */
  public _updateItem = async (rowId: number, item: any): Promise<any> => {
    const list = this._sp.web.lists.getByTitle(this._config.processingList)
    const itemUpdateResult = await list.items.getById(rowId).update({
      GtIdeaProjectDataId: item.Id
    })
    Log.info(LOG_SOURCE, '_updateItem: Updated item with new GtIdeaProjectDataId')
    return itemUpdateResult.data
  }

  /**
   * Add item
   *
   * @param properties Properties
   */
  public _addItem = async (properties: Record<string, any>): Promise<any> => {
    const list = this._sp.web.lists.getByTitle(strings.IdeaProjectDataTitle)
    const itemAddResult = await list.items.add(properties)
    Log.info(LOG_SOURCE, '_updateItem: Added item to IdeaProjectData list')
    return itemAddResult.data
  }

  /**
   * Edit form URL with added Source parameter generated from the item ID
   *
   * @param item Item
   */
  public editFormUrl = (item: any) => {
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
