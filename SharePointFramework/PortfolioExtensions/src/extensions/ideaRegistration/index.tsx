import { override } from '@microsoft/decorators'
import { Log } from '@microsoft/sp-core-library'
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters,
  RowAccessor
} from '@microsoft/sp-listview-extensibility'
import { Dialog } from '@microsoft/sp-dialog'
import DialogPrompt from 'components/IdeaApprovalDialog'
import { SPFI, spfi, SPFx } from '@pnp/sp'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/site-groups/web'
import '@pnp/sp/clientside-pages/web'
import { ClientsideText } from '@pnp/sp/clientside-pages'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import { isUserAuthorized } from 'helpers/isUserAuthorized'
import strings from 'PortfolioExtensionsStrings'
import { IdeaConfigurationModel, SPIdeaConfigurationItem } from 'models'

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = DEBUG ? LogLevel.Info : LogLevel.Warning
const LOG_SOURCE: string = 'IdeaRegistrationCommand'

enum RecommendationType {
  Approved = 'Godkjent for detaljering av idé',
  Consideration = 'Under vurdering',
  Rejected = 'Avvist'
}

export default class IdeaRegistrationCommand extends BaseListViewCommandSet<any> {
  private _userAuthorized: boolean
  private _openCmd: Command
  private _sp: SPFI
  private _ideaConfig: IdeaConfigurationModel

  @override
  public async onInit(): Promise<void> {
    Logger.log({
      message: '(IdeaRegistrationCommand) onInit: Initializing...',
      data: { version: this.context.manifest.version },
      level: LogLevel.Info
    })
    this._sp = spfi().using(SPFx(this.context))
    this._openCmd = this.tryGetCommand('OPEN_IDEA_REGISTRATION_DIALOG')
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
  public async onExecute(event: IListViewCommandSetExecuteEventParameters) {
    switch (event.itemId) {
      case this._openCmd.id:
        const dialog: DialogPrompt = new DialogPrompt()
        const row = event.selectedRows[0]

        dialog.ideaTitle = row.getValueByName('Title')
        dialog.dialogDescription = this._ideaConfig.description || strings.SetRecommendationDefaultDescription
        await dialog.show()
        if (dialog.comment && dialog.selectedChoice === strings.ApproveChoice) {
          this._isIdeaRecommended(row)
            ? Dialog.alert(strings.IdeaAlreadyApproved)
            : this._onSubmit(row, dialog.comment)
        } else if (dialog.comment && dialog.selectedChoice === strings.ConsiderationChoice) {
          this._isIdeaRecommended(row)
            ? Dialog.alert(strings.IdeaAlreadyApproved)
            : this._onSubmitConsideration(row, dialog.comment)
        } else if (dialog.comment && dialog.selectedChoice === strings.RejectChoice) {
          this._isIdeaRecommended(row)
            ? Dialog.alert(strings.IdeaAlreadyApproved)
            : this._onSubmitRejected(row, dialog.comment)
        } else {
          Logger.log({ message: 'Rejected', level: LogLevel.Info })
        }
        break
      default:
        throw new Error('Unknown command, unable to execute')
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
      message: '(IdeaRegistrationCommand) onListViewStateChanged: ListView state changed',
      level: LogLevel.Info
    })

    const listName = this.context.pageContext.list.title
    const [ideaConfig] = (await this._getIdeaConfiguration()).filter((item) => item.registrationList === listName)
    this._ideaConfig = ideaConfig

    if (ideaConfig) {
      this._openCmd = this.tryGetCommand('OPEN_IDEA_REGISTRATION_DIALOG')
      if (this._openCmd) {

        this._openCmd.visible =
          this.context.listView.selectedRows?.length === 1 &&
          this._userAuthorized && ideaConfig.registrationList === listName
      }
      this.raiseOnChange()
    } else {
      Logger.log({
        message: '(IdeaRegistrationCommand) onListViewStateChanged: You are currently not authorized to use this command or the list is not configured for this command',
        level: LogLevel.Info
      })
    }
  }

  /**
   * On submit and 'Rejected', fields will be updated
   *
   * @param row Selected row
   * @param comment Comment from the dialog
   */
  private _onSubmitRejected(row: RowAccessor, comment: string) {
    const rowId = row.getValueByName('ID')
    this._sp.web.lists
      .getByTitle(this._ideaConfig.registrationList)
      .items.getById(rowId)
      .update({
        GtIdeaRecommendation: RecommendationType.Rejected,
        GtIdeaRecommendationComment: comment
      })
      .then(() => {
        Log.info(LOG_SOURCE, `Updated ${this._ideaConfig.registrationList}: Rejected`)
        window.location.reload()
      })
  }

  /**
   * On submit and 'Consideration', fields will be updated
   *
   * @param row Selected row
   * @param comment Comment from the dialog
   */
  private _onSubmitConsideration(row: RowAccessor, comment: string) {
    const rowId = row.getValueByName('ID')
    this._sp.web.lists
      .getByTitle(this._ideaConfig.registrationList)
      .items.getById(rowId)
      .update({
        GtIdeaRecommendation: RecommendationType.Consideration,
        GtIdeaRecommendationComment: comment
      })
      .then(() => {
        Log.info(LOG_SOURCE, `Updated ${this._ideaConfig.registrationList}: Consideration`)
        window.location.reload()
      })
  }

  /**
   * On submit and 'Approved', fields will be updated,
   * - Creates a new item to 'Idebehandling' list
   * - Creates a sitepage for the registration will be created
   *
   * @param row Selected row
   * @param comment Comment from the dialog
   */
  private _onSubmit(row: RowAccessor, comment: string) {
    const rowId = row.getValueByName('ID')
    const rowTitle = row.getValueByName('Title')
    this._sp.web.lists
      .getByTitle(this._ideaConfig.registrationList)
      .items.getById(rowId)
      .update({
        GtIdeaRecommendation: RecommendationType.Approved,
        GtIdeaRecommendationComment: comment
      })
      .then(() => {
        Log.info(LOG_SOURCE, `Updated ${this._ideaConfig.registrationList}: Approved`)
      })
      .catch((e) => Log.error(LOG_SOURCE, e))

    this._updateProcessingList(rowId, rowTitle)
    this._createSitePage(row)
  }

  /**
   * Update the work list with selected values of the registration list
   *
   * @param rowId Id of the row in the registration list
   * @param rowTitle Title of the row in the registration list
   */
  private _updateProcessingList(rowId: number, rowTitle: string) {
    const url = rowTitle.replace(/ /g, '-')
    const baseUrl = this.context.pageContext.web.absoluteUrl
    const ideaUrl = baseUrl.concat('/SitePages/', url, '.aspx')

    this._sp.web.lists
      .getByTitle(this._ideaConfig.processingList)
      .items.add({
        Title: rowTitle,
        GtRegistratedIdeaId: rowId,
        GtIdeaUrl: ideaUrl
      })
      .then(() => Log.info(LOG_SOURCE, 'Updated work lits'))
      .catch((e) => Log.error(LOG_SOURCE, e))
  }

  /**
   * Create a site page with the selected values of the registration list
   *
   * @param row Selected row
   */
  private async _createSitePage(row: RowAccessor) {
    const title: string = row.getValueByName('Title')
    const page = await this._sp.web.addClientsidePage(title, title, 'Article')

    page
      .addSection()
      .addColumn(6)
      .addControl(
        new ClientsideText(`
    <h3>Tittel</h3><br>
     ${row.getValueByName('Title')}
    `)
      )
      .addControl(
        new ClientsideText(`
      <h3>Bakgrunn</h2><br>
      ${row.getValueByName('GtIdeaBackground')}
      `)
      )
      .addControl(
        new ClientsideText(`
      <h3>Forslag til løsning</h2><br>
      ${row.getValueByName('GtIdeaSolutionProposals')}
      `)
      )
      .addControl(
        new ClientsideText(`
      <h3>Overordnet gjennomføringsplan</h2><br>
      ${row.getValueByName('GtIdeaExecutionPlan')}
      `)
      )
      .addControl(
        new ClientsideText(`
      <h3>Ressursbehov</h2><br>
      ${row.getValueByName('GtIdeaResourceRequirements')}
      `)
      )

    page.sections[0]
      .addColumn(6)
      .addControl(
        new ClientsideText(`
        <h3>Problemstilling</h2><br> 
        ${row.getValueByName('GtIdeaIssue')}
        `)
      )
      .addControl(
        new ClientsideText(`
          <h3>Mulige gevinster</h2><br> 
          ${row.getValueByName('GtIdeaPossibleGains')}
          `)
      )
      .addControl(
        new ClientsideText(`
          <h3>Berørte parter</h2><br> 
          ${row.getValueByName('GtIdeaAffectedParties')}
          `)
      )
      .addControl(
        new ClientsideText(`
              <h3>Kritiske suksessfaktorer</h2><br> 
              ${row.getValueByName('GtIdeaCriticalSuccessFactors')}
              `)
      )
      .addControl(
        new ClientsideText(`
              <h3>Andre kommentarer</h2><br> 
              ${row.getValueByName('GtIdeaOtherComments')}
              `)
      )

    await page.save()
    Log.info(LOG_SOURCE, 'Site created successfully')
    window.location.reload()
  }

  /**
   * Returns true if the idea is already recommended
   *
   * @param row Selected row
   */
  private _isIdeaRecommended(row: RowAccessor): boolean {
    return row.getValueByName('GtIdeaRecommendation') === RecommendationType.Approved
  }
}
