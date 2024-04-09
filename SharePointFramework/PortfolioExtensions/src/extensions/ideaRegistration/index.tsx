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
import { isUserAuthorized } from '../../helpers/isUserAuthorized'
import strings from 'PortfolioExtensionsStrings'
import { Choice, IdeaConfigurationModel, SPIdeaConfigurationItem } from 'models'
import { find } from 'underscore'

const LOG_SOURCE: string = 'IdeaRegistrationCommand'

export default class IdeaRegistrationCommand extends BaseListViewCommandSet<any> {
  private _userAuthorized: boolean
  private _openCmd: Command
  private _openLinkCmd: Command
  private _sp: SPFI
  private _config: IdeaConfigurationModel

  @override
  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'onInit: Initializing...')
    this._sp = spfi().using(SPFx(this.context))
    this._openCmd = this.tryGetCommand('OPEN_IDEA_REGISTRATION_DIALOG')
    this._openCmd.visible = false
    this._openLinkCmd = this.tryGetCommand('IDEA_PROCESSING_LINK')
    this._openLinkCmd.visible = this.context.pageContext.list.title.includes('registrering')
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
        dialog.dialogMessage = this._config.description.registration
        dialog.choices = this._config.registration
        await dialog.show()

        if (dialog.comment) {
          const selectedChoice = find(this._config.registration, {
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

      case this._openLinkCmd.id:
        const listName = this.context.pageContext.list.title
        const [config] = (await this._getIdeaConfiguration()).filter(
          (item) => item.registrationList === listName
        )
        this._config = config

        const baseUrl = this.context.pageContext.web.absoluteUrl
        const processingList = this._config.processingList.replace('é', 'e')
        const ideaProcessingUrl = `${baseUrl}/Lists/${processingList}`
        window.open(ideaProcessingUrl, '_blank')
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
      (item) => item.registrationList === listName
    )
    this._config = config

    if (config) {
      this._openCmd = this.tryGetCommand('OPEN_IDEA_REGISTRATION_DIALOG')
      if (this._openCmd) {
        this._openCmd.visible =
          this.context.listView.selectedRows?.length === 1 &&
          this._userAuthorized &&
          config.registrationList === listName
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
   * On submit and 'Rejected', fields will be updated
   *
   * @param row Selected row
   * @param comment Comment from the dialog
   */
  private _onSubmitRejected = async (row: RowAccessor, comment: string): Promise<void> => {
    const rowId = row.getValueByName('ID')
    await this._sp.web.lists
      .getByTitle(this._config.registrationList)
      .items.getById(rowId)
      .update({
        GtIdeaRecommendation: find(this._config.registration, { key: Choice.Reject })
          ?.recommendation,
        GtIdeaRecommendationComment: comment
      })

    Log.info(LOG_SOURCE, `Updated ${this._config.registrationList}: Rejected`)
    window.location.reload()
  }

  /**
   * On submit and 'Consideration', fields will be updated
   *
   * @param row Selected row
   * @param comment Comment from the dialog
   */
  private _onSubmitConsideration = async (row: RowAccessor, comment: string): Promise<void> => {
    const rowId = row.getValueByName('ID')
    await this._sp.web.lists
      .getByTitle(this._config.registrationList)
      .items.getById(rowId)
      .update({
        GtIdeaRecommendation: find(this._config.registration, { key: Choice.Consideration })
          ?.recommendation,
        GtIdeaRecommendationComment: comment
      })

    Log.info(LOG_SOURCE, `Updated ${this._config.registrationList}: Consideration`)
    window.location.reload()
  }

  /**
   * On submit and 'Approved', fields will be updated,
   * - Creates a new item to 'Idebehandling' list
   * - Creates a sitepage for the registration will be created
   *
   * @param row Selected row
   * @param comment Comment from the dialog
   */
  private _onSubmit = async (row: RowAccessor, comment: string): Promise<void> => {
    const rowId = row.getValueByName('ID')
    const rowTitle = row.getValueByName('Title')

    await this._sp.web.lists
      .getByTitle(this._config.registrationList)
      .items.getById(rowId)
      .update({
        GtIdeaRecommendation: find(this._config.registration, { key: Choice.Approve })
          ?.recommendation,
        GtIdeaRecommendationComment: comment
      })

    Log.info(LOG_SOURCE, `Updated ${this._config.registrationList}: Approved`)

    await this._updateProcessingList(rowId, rowTitle)
    await this._createSitePage(row)

    window.location.reload()
  }

  /**
   * On submit and 'Other', fields will be updated,
   *
   * @param row Selected row
   * @param comment Comment from the dialog
   */
  private _onSubmitOther = async (row: RowAccessor, comment: string, selectedChoice: string): Promise<void> => {
    const rowId = row.getValueByName('ID')

    await this._sp.web.lists
      .getByTitle(this._config.registrationList)
      .items.getById(rowId)
      .update({
        GtIdeaRecommendation: find(this._config.registration, { choice: selectedChoice })
          ?.recommendation,
        GtIdeaRecommendationComment: comment
      })

    Log.info(LOG_SOURCE, `Updated ${this._config.registrationList}: Other`)

    window.location.reload()
  }

  /**
   * Update the work list with selected values of the registration list
   *
   * @param rowId Id of the row in the registration list
   * @param rowTitle Title of the row in the registration list
   */
  private _updateProcessingList = async (rowId: number, rowTitle: string): Promise<void> => {
    const url = rowTitle.replace(/ /g, '-').replace(/é/g, 'e')
    const baseUrl = this.context.pageContext.web.absoluteUrl
    const ideaUrl = `${baseUrl}/SitePages/KUR-${url}.aspx`

    await this._sp.web.lists.getByTitle(this._config.processingList).items.add({
      Title: rowTitle,
      GtRegistratedIdeaId: rowId,
      GtIdeaUrl: ideaUrl
    })

    Log.info(LOG_SOURCE, 'Updated work list')
  }

  /**
   * Returns true if the idea is already recommended
   *
   * @param row Selected row
   */
  private _isIdeaRecommended = (row: RowAccessor): boolean => {
    return (
      row.getValueByName('GtIdeaRecommendation') ===
      find(this._config.registration, { key: Choice.Approve })?.recommendation
    )
  }

  /**
   * Create a site page with the selected values of the registration list
   *
   * @param row Selected row
   */
  private _createSitePage = async (row: RowAccessor): Promise<void> => {
    const title: string = row.getValueByName('Title')
    const urlFriendlyTitle = title.replace(/é/g, 'e').replace(/[^a-zA-Z0-9-_ÆØÅæøå ]/g, '')
    const page = await this._sp.web.addClientsidePage(
      `KUR-${urlFriendlyTitle}`,
      `KUR-${urlFriendlyTitle}`,
      'Article'
    )

    const reporter = row.getValueByName('GtIdeaReporter')[0] || ''

    page.layoutType = 'NoImage'
    page.showTopicHeader = true
    page.topicHeader = 'Idé'
    page.description = `Konsept utredningsrapport for: ${title}`

    const section = page.addSection()
    const column1 = section.addColumn(4)
    const column2 = section.addColumn(4)
    const column3 = section.addColumn(4)

    column1.addControl(new ClientsideText(`<h3>Tittel</h3>${row.getValueByName('Title')}`))
    column1.addControl(
      new ClientsideText(`<h3>Bakgrunn</h3>${row.getValueByName('GtIdeaBackground')}`)
    )
    column1.addControl(
      new ClientsideText(
        `<h3>Forslag til løsning</h3>${row.getValueByName('GtIdeaSolutionProposals')}`
      )
    )
    column1.addControl(
      new ClientsideText(
        `<h3>Overordnet gjennomføringsplan</h3>${row.getValueByName('GtIdeaExecutionPlan')}`
      )
    )

    column2.addControl(
      new ClientsideText(
        `<h3>Innmelder</h3><a href="mailto:${reporter.email}" target="_blank">${reporter.title}</a>`
      )
    )
    column2.addControl(
      new ClientsideText(`<h3>Ressursbehov</h3>${row.getValueByName('GtIdeaResourceRequirements')}`)
    )
    column2.addControl(
      new ClientsideText(`<h3>Problemstilling</h3>${row.getValueByName('GtIdeaIssue')}`)
    )
    column2.addControl(
      new ClientsideText(`<h3>Mulige gevinster</h3>${row.getValueByName('GtIdeaPossibleGains')}`)
    )

    column3.addControl(
      new ClientsideText(`<h3>Berørte parter</h3>${row.getValueByName('GtIdeaAffectedParties')}`)
    )
    column3.addControl(
      new ClientsideText(
        `<h3>Kritiske suksessfaktorer</h3>${row.getValueByName('GtIdeaCriticalSuccessFactors')}`
      )
    )
    column3.addControl(
      new ClientsideText(`<h3>Andre kommentarer</h3>${row.getValueByName('GtIdeaOtherComments')}`)
    )

    section.emphasis = 1

    await page.save()
    Log.info(LOG_SOURCE, 'Site created successfully')
    window.location.reload()
  }
}
