import strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from '../../types'
import { NO_TEMPLATE_ID } from '../../constants'
import { BaseTask, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'

export class CustomActions extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('CustomActions', data)
  }

  /**
   * Execute CustomActions
   *
   * @param params Task parameters
   * @param onProgress On progress function
   */
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
   * Update custom action for library template selector based on value set for the selected template.
   *
   * The custom actions are fetched fresh here, as the template selector custom action
   * may have been added by the `CustomActions` handler during the `ApplyTemplate` task.
   *
   * @param customActionTitle Custom action title for the library template selector.
   */
  private async _updateTemplateSelectorCustomAction(customActionTitle = 'Malvelger') {
    const templateLibraryUrl = this.data.selectedTemplate.templateLibraryUrl
    const customActions = await this.params.web.userCustomActions<
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
