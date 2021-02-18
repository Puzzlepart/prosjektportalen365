import { IPropertyPaneConfiguration, PropertyPaneToggle } from '@microsoft/sp-property-pane'
import { IProjectInformationProps, ProjectInformation } from 'components/ProjectInformation'
import * as strings from 'ProjectWebPartsStrings'
import { BaseProjectWebPart } from '../@baseProjectWebPart'

export default class ProjectInformationWebPart extends BaseProjectWebPart<
  IProjectInformationProps
> {
  public async onInit() {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent(ProjectInformation, {
      onFieldExternalChanged: this._onFieldExternalChanged.bind(this)
    })
  }

  private _onFieldExternalChanged(fieldName: string, checked: boolean) {
    const showFieldExternal = { ...(this.properties.showFieldExternal || {}), [fieldName]: checked }
    this.properties.showFieldExternal = showFieldExternal
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneToggle('skipSyncToHub', {
                  label: strings.SkipSyncToHubLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
