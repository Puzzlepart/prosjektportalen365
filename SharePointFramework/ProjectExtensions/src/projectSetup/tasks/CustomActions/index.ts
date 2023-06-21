import strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from '../../types'
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
    onProgress(strings.CustomActionsText, strings.CustomActionsSubText, 'SetAction')
    await this._updateTemplateSelectorCustomAction()
    return params
  }

  /**
   * Update custom action for template selector based on value set for the selected template.
   *
   * @param customActionTitle Custom action title for the template selector.
   */
  private async _updateTemplateSelectorCustomAction(customActionTitle = 'Malvelger') {
    const templateLibraryUrl = this.data.selectedTemplate.templateLibraryUrl
    const templateSelectorCustomAction = this.data.customActions.find(
      (c) => c.Title === customActionTitle
    )
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
      })
    }
  }
}
