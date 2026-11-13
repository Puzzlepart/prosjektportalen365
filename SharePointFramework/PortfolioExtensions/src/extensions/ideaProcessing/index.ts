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
import { startCommandSetTelemetryWithOwnPortal } from '../../helpers/commandSetTelemetry'
import { ideaChoiceVariant } from '../../helpers/ideaChoiceVariant'
import { isUserAuthorized } from '../../helpers/isUserAuthorized'
import { themeColor } from 'pp365-shared-library'
import { flushTelemetry, trackError, trackUsage } from 'pp365-shared-library/lib/telemetry'
import resource from 'SharedResources'

/** The command set's alias in its manifest, which usage statistics count it by. */
const TELEMETRY_COMPONENT = 'IdeaProcessing'

/** Records configured decisions and comments on selected ideas in the processing list. */
export default class IdeaProcessCommand extends BaseListViewCommandSet<any> {
  private _userAuthorized: boolean
  private _openCmd: Command
  private _sp: SPFI
  private _config: IdeaConfigurationModel

  @override
  public async onInit(): Promise<void> {
    this._sp = spfi().using(SPFx(this.context))
    // In the background: the command set holds no hub data service, and waits for none.
    void startCommandSetTelemetryWithOwnPortal(this.context)
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
              void Dialog.alert(strings.IdeaAlreadyApproved)
            } else {
              switch (selectedChoice) {
                case Choice.Approve:
                  void this._saveDecision(() => this._onSubmit(row, dialog.comment))
                  break
                case Choice.Consideration:
                  void this._saveDecision(() => this._onSubmitConsideration(row, dialog.comment))
                  break
                case Choice.Reject:
                  void this._saveDecision(() => this._onSubmitRejected(row, dialog.comment))
                  break
                default:
                  void this._saveDecision(() =>
                    this._onSubmitOther(row, dialog.comment, dialog.selectedChoice)
                  )
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
   * Runs the save of the decision the dialog was closed with, and tells the user when it fails:
   * the dialog is gone by then, and nothing else on the page says that the decision was not
   * saved. The failure is counted for usage statistics by the error's code. A save counts its
   * decision and reloads the page as its last step, so a failed one does neither.
   *
   * @param save The save to run
   */
  private async _saveDecision(save: () => Promise<void>): Promise<void> {
    try {
      await save()
    } catch (error) {
      trackError(TELEMETRY_COMPONENT, error)
      await Dialog.alert(strings.IdeaRecommendationSaveErrorMessage)
    }
  }

  /**
   * Reloads the page once a decision is saved. The decision is counted for usage statistics
   * first, and sent at once: a count left in memory is lost when the page reloads.
   *
   * @param choiceKey The chosen choice's key in the idea configuration; none for a choice the
   * customer has added, which counts as `other`
   */
  private _reloadAfterDecision(choiceKey?: string): void {
    trackUsage(TELEMETRY_COMPONENT, 'idea.decided', ideaChoiceVariant(choiceKey))
    flushTelemetry({ urgent: true })
    window.location.reload()
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
   * Saves the configured rejection decision and comment, then reloads the list.
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
    this._reloadAfterDecision(Choice.Reject)
  }

  /**
   * Saves the configured consideration decision and comment, then reloads the list.
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
    this._reloadAfterDecision(Choice.Consideration)
  }

  /**
   * Saves the configured approval decision and comment, then reloads the list.
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
    this._reloadAfterDecision(Choice.Approve)
  }

  /**
   * Saves the decision for a custom choice and its comment, then reloads the list.
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
    this._reloadAfterDecision()
  }

  /**
   * Checks whether the row already has the configured approval decision.
   */
  private _isIdeaRecommended = (row: RowAccessor): boolean => {
    return (
      row.getValueByName('GtIdeaDecision') ===
      find(this._config.processing, { key: Choice.Approve })?.recommendation
    )
  }
}
