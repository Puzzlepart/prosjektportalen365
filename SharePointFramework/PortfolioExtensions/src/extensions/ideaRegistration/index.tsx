import { override } from '@microsoft/decorators'
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
import '@pnp/sp/folders/list'
import '@pnp/sp/site-groups/web'
import '@pnp/sp/clientside-pages/web'
import { isUserAuthorized } from '../../helpers/isUserAuthorized'
import strings from 'PortfolioExtensionsStrings'
import { Choice, IdeaConfigurationModel, SPIdeaConfigurationItem } from 'models'
import { find } from 'underscore'
import { ProjectContentColumn, SPProjectContentColumnItem } from 'pp365-shared-library'
import _ from 'underscore'
import { PortalDataService } from 'pp365-shared-library/lib/services/PortalDataService'

const LOG_SOURCE: string = 'IdeaRegistrationCommand'

export default class IdeaRegistrationCommand extends BaseListViewCommandSet<any> {
  private _userAuthorized: boolean
  private _openCmd: Command
  private _openLinkCmd: Command
  private _sp: SPFI
  private _config: IdeaConfigurationModel
  private _portalDataService: PortalDataService

  @override
  public async onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context))
    this._portalDataService = await new PortalDataService().configure({
      spfxContext: this.context
    })
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
        try {
          const ideaProcessingUrl = await this._getIdeaProcessingList()
          window.open(ideaProcessingUrl, '_blank')
        } catch (error) {
          alert(strings.IdeaProcessingListErrorMessage)
          throw new Error(error)
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
   * Get the IdeaProcessing list url from the IdeaConfiguration list
   */
  private _getIdeaProcessingList = async (): Promise<string> => {
    const [config] = (await this._getIdeaConfiguration()).filter(
      (item) => item.registrationList === this.context.pageContext.list.title
    )
    const processingList = await this._sp.web.lists.getByTitle(config.processingList).rootFolder()
    return processingList.ServerRelativeUrl
  }

  /**
   * On ListView state changed, check if the user is authorized to use this command
   */
  private _onListViewStateChanged = async (): Promise<void> => {
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
    const contentColumns = async () => {
      try {
        const list = this._sp.web.lists.getByTitle('Prosjektinnholdskolonner')

        const columnItems = await list.items.select(
          ...Object.keys(new SPProjectContentColumnItem())
        )()

        const filteredColumnItems = columnItems.filter(
          (col) =>
            col.GtDataSourceCategory === 'Idémodul' ||
            (!col.GtDataSourceCategory && !col.GtDataSourceLevel) ||
            (!col.GtDataSourceCategory && _.contains(col.GtDataSourceLevel, 'Portefølje'))
        )

        return filteredColumnItems
          .filter((col) => col.GtIdeaCopyToProcess)
          .map((item) => new ProjectContentColumn(item))
      } catch (error) {
        throw new Error(error)
      }
    }

    const columns = await contentColumns()
    const processingColumns = await this._portalDataService.getListFields(
      this._config.processingList,
      "substringof('Gt', InternalName) or InternalName eq 'Title'",
      this._sp.web
    )
    const registrationList = row

    const userFields = registrationList.fields
      .filter((fld) => fld.fieldType.indexOf('User') === 0)
      .map((fld) => fld.internalName)

    const columnsToCopy = processingColumns.filter((col) => {
      const field = registrationList.fields.find(
        (f) => f.internalName === col.InternalName || f.displayName === col.Title
      )

      const fieldsToCopy =
        field &&
        columns.find(
          (contentCol) =>
            contentCol.internalName === field.internalName ||
            contentCol.fieldName === field.displayName
        )

      return fieldsToCopy
    })

    const copyData = columnsToCopy
      .map((col) => {
        if (userFields.includes(col.InternalName)) {
          return {
            [`${col.InternalName}Id`]: registrationList.getValueByName(col.InternalName)[0]?.id
          }
        }

        const internalName = registrationList.fields.find(
          (fld) => fld.displayName === col.Title || fld.internalName === col.InternalName
        )?.internalName

        return {
          [col.InternalName]: registrationList.getValueByName(internalName)
        }
      })
      .reduce((acc, val) => ({ ...acc, ...val }), {})

    const rowId = row.getValueByName('ID')

    await this._sp.web.lists
      .getByTitle(this._config.registrationList)
      .items.getById(rowId)
      .update({
        GtIdeaRecommendation: find(this._config.registration, { key: Choice.Approve })
          ?.recommendation,
        GtIdeaRecommendationComment: comment
      })

    const ideaModuleUrl = `${this.context.pageContext.site.absoluteUrl}/SitePages/Idemodul.aspx#ideaId=${rowId}`

    await this._updateProcessingList(rowId, copyData, ideaModuleUrl)
    window.location.reload()
  }

  /**
   * On submit and 'Other', fields will be updated,
   *
   * @param row Selected row
   * @param comment Comment from the dialog
   */
  private _onSubmitOther = async (
    row: RowAccessor,
    comment: string,
    selectedChoice: string
  ): Promise<void> => {
    const rowId = row.getValueByName('ID')

    await this._sp.web.lists
      .getByTitle(this._config.registrationList)
      .items.getById(rowId)
      .update({
        GtIdeaRecommendation: find(this._config.registration, { choice: selectedChoice })
          ?.recommendation,
        GtIdeaRecommendationComment: comment
      })

    window.location.reload()
  }

  /**
   * Update the work list with selected values of the registration list
   *
   * @param rowId Id of the row in the registration list
   * @param copyData Data to copy from the registration list to processing list
   */
  private _updateProcessingList = async (
    rowId: number,
    copyData: any,
    pageUrl: string
  ): Promise<void> => {
    await this._sp.web.lists.getByTitle(this._config.processingList).items.add({
      GtRegistratedIdeaId: rowId,
      GtIdeaUrl: pageUrl,
      ...copyData
    })
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
}
