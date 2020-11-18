import {
  IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
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
              groupName: strings.ProjectStatusGroupName,
              groupFields: [
                PropertyPaneSlider('statusReportsCount', {
                  label: strings.StatusReportsCountLabel,
                  min: 0,
                  max: 10,
                  step: 1
                }),
                PropertyPaneTextField('statusReportsHeader', {
                  label: strings.StatusReportsHeaderLabel
                }),
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
