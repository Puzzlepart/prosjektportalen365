import { override } from '@microsoft/decorators'
import { Log } from '@microsoft/sp-core-library'
import { Dialog } from '@microsoft/sp-dialog'
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
import { startCommandSetTelemetryWithOwnPortal } from '../../helpers/commandSetTelemetry'
import { isUserAuthorized } from '../../helpers/isUserAuthorized'
import strings from 'PortfolioExtensionsStrings'
import { Choice, IdeaConfigurationModel, SPIdeaConfigurationItem } from 'models'
import { find } from 'underscore'
import { themeColor } from 'pp365-shared-library'
import { flushTelemetry, trackError, trackUsage } from 'pp365-shared-library/lib/telemetry'
import resource from 'SharedResources'

/** Custom-action properties for the idea-to-project-data command. */
export interface IIdeaProjectDataCommandProperties {
  ideaId: number
}

const LOG_SOURCE: string = 'IdeaProjectDataCommand'

/** The command set's alias in its manifest, which usage statistics count it by. */
const TELEMETRY_COMPONENT = 'IdeaProjectData'

/** Creates and links project data for an approved idea, then opens the new item's edit form. */
export default class IdeaProjectDataCommand extends BaseListViewCommandSet<IIdeaProjectDataCommandProperties> {
  private _userAuthorized: boolean
  private _openCmd: Command
  private _sp: SPFI
  private _config: IdeaConfigurationModel

  @override
  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'onInit: Initializing...')
    this._sp = spfi().using(SPFx(this.context))
    // In the background: the command set holds no hub data service, and waits for none.
    void startCommandSetTelemetryWithOwnPortal(this.context)
    this._openCmd = this.tryGetCommand('OPEN_IDEA_PROJECTDATA_DIALOG')

    this._openCmd.title = strings.IdeaProjectDataCommandTitle

    const fillColor = themeColor
    const exportSvgCmd = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2048 2048'%3E%3Cpath d='M1088 960h320v128h-320v320H960v-320H640V960h320V640h128v320zm-64-832q124 0 238 32t214 90 181 140 140 181 91 214 32 239q0 124-32 238t-90 214-140 181-181 140-214 91-239 32q-124 0-238-32t-214-90-181-140-140-181-91-214-32-239q0-124 32-238t90-214 140-181 181-140 214-91 239-32zm0 1664q106 0 204-27t183-78 156-120 120-155 77-184 28-204q0-106-27-204t-78-183-120-156-155-120-184-77-204-28q-106 0-204 27t-183 78-156 120-120 155-77 184-28 204q0 106 27 204t78 183 120 156 155 120 184 77 204 28z' fill='${fillColor.replace(
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
        void dialog.show()
        dialog.submit = this._onSubmit.bind(this, row, dialog)
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
   * Loads the list configuration and shows the command for one selected row and an authorized user.
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
   * Creates project data for the selected idea, and tells the user when that fails: as an error
   * in the dialog, which is still open and stays so for another try, or in an alert when the user
   * has closed it meanwhile. The failure is counted for usage statistics by the error's code. The
   * creation is counted and the page left as the last step, so a failed one does neither.
   *
   * @param row The selected idea
   * @param dialog The dialog the creation was started from
   */
  private _onSubmit = async (row: RowAccessor, dialog: IdeaDialog): Promise<void> => {
    // An earlier try's error goes first: when this one fails too, the message is read out again.
    dialog.setErrorMessage()
    try {
      const rowId = row.getValueByName('ID')
      const rowTitle = row.getValueByName('Title')
      await this._redirectNewItem(rowId, rowTitle)
    } catch (error) {
      trackError(TELEMETRY_COMPONENT, error)
      if (dialog.isOpen) dialog.setErrorMessage(strings.IdeaProjectDataSaveErrorMessage)
      else await Dialog.alert(strings.IdeaProjectDataSaveErrorMessage)
    }
  }

  /**
   * Project data created for an idea whose processing row could not be linked to it, by the row's
   * id. Kept while the page is open, so that another try links it rather than creating a second.
   */
  private _unlinkedProjectData = new Map<number, any>()

  /**
   * Creates project data, links it to the processing row and navigates to its edit form. Project
   * data an earlier try created but could not link is linked now, and not created again.
   */
  private _redirectNewItem = async (rowId: number, rowTitle: string): Promise<void> => {
    const properties: Record<string, any> = {
      Title: rowTitle,
      GtProjectFinanceName: rowTitle
    }

    let item = this._unlinkedProjectData.get(rowId)
    if (!item) {
      item = await this._addItem(properties)
      Log.info(LOG_SOURCE, '_redirectNewItem: Created new item')
      this._unlinkedProjectData.set(rowId, item)
    }
    await this._updateItem(rowId, item)
    this._unlinkedProjectData.delete(rowId)
    // Counted for usage statistics and sent at once: the page is left for the edit form below.
    trackUsage(TELEMETRY_COMPONENT, 'idea.projectDataCreated')
    flushTelemetry({ urgent: true })
    document.location.hash = ''
    document.location.href = this.editFormUrl(item)
  }

  /**
   * Links the processing row to the newly created project-data item's id.
   */
  public _updateItem = async (rowId: number, item: any): Promise<any> => {
    const list = this._sp.web.lists.getByTitle(this._config.processingList)
    const itemUpdateResult = await list.items.getById(rowId).update({
      GtIdeaProjectDataId: item.Id
    })
    Log.info(LOG_SOURCE, '_updateItem: Updated item with new GtIdeaProjectDataId')
    return itemUpdateResult
  }

  /**
   * Adds an item to the hub's project-data list.
   */
  public _addItem = async (properties: Record<string, any>): Promise<any> => {
    const list = this._sp.web.lists.getByTitle(resource.Lists_ProjectData_Title)
    const itemAddResult = await list.items.add(properties)
    Log.info(LOG_SOURCE, '_updateItem: Added item to IdeaProjectData list')
    return itemAddResult
  }

  /**
   * Builds the project-data edit URL with the current page as its return address.
   */
  public editFormUrl = (item: any) => {
    return [
      `${this.context.pageContext.web.absoluteUrl}`,
      `/${resource.Lists_ProjectData_Url}/EditForm.aspx`,
      '?ID=',
      item.Id,
      '&Source=',
      encodeURIComponent(window.location.href)
    ].join('')
  }
}
