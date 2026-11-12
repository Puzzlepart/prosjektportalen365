import strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from '../../types'
import { NO_TEMPLATE_ID } from '../../constants'
import { BaseTask, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'

/** Points the document-template command at the library selected by the project template. */
export class CustomActions extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('CustomActions', data)
  }

  /** Updates the template selector's custom action on a best-effort basis when applying a template. */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    this.params = params
    onProgress(strings.CustomActionsText, strings.CustomActionsSubText, 'SetAction', {
      message: 'Updating custom actions for the project',
      level: 'info'
    })
    if (this.data.selectedTemplate?.id === NO_TEMPLATE_ID) {
      this.logInformation('Skipping custom action update (no template selected)')
      return params
    }
    try {
      await this._updateTemplateSelectorCustomAction()
    } catch (error) {}
    return params
  }

  /**
   * Sets the document-template library on the selector's custom action.
   *
   * The custom actions are fetched fresh here, as the template selector custom action
   * may have been added by the `CustomActions` handler during the `ApplyTemplate` task.
   */
  private async _updateTemplateSelectorCustomAction(customActionTitle = 'Malvelger') {
    const templateLibraryUrl = this.data.selectedTemplate.templateLibraryUrl
    const customActions =
      await this.params.web.userCustomActions<
        { Id: string; Title: string; ClientSideComponentProperties: string }[]
      >()
    const templateSelectorCustomAction = customActions.find(
      ({ Title }) => Title === customActionTitle
    )
    if (!Boolean(templateSelectorCustomAction)) {
      return
    }
    let templateSelectorCustomActionProperties = JSON.parse(
      templateSelectorCustomAction.ClientSideComponentProperties
    )
    if (templateSelectorCustomActionProperties.templateLibrary !== templateLibraryUrl) {
      templateSelectorCustomActionProperties = {
        ...templateSelectorCustomActionProperties,
        templateLibrary: templateLibraryUrl
      }
      await this.params.web.userCustomActions.getById(templateSelectorCustomAction.Id).update({
        ClientSideComponentProperties: JSON.stringify(templateSelectorCustomActionProperties)
      } as any)
    }
  }
}
