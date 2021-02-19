import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { IProjectListProps, ProjectList } from 'components/ProjectList'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'

export default class ProjectListWebPart extends BasePortfolioWebPart<IProjectListProps> {
  public render(): void {
    this.renderComponent<IProjectListProps>(ProjectList)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('sortBy', {
                  label: strings.SortByFieldLabel,
                  disabled: true
                }),
                PropertyPaneTextField('searchBoxPlaceholderText', {
                  label: strings.SearchBoxPlaceholderTextLabel
                }),
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel
                }),
                PropertyPaneToggle('showViewSelector', {
                  label: strings.ShowViewSelectorLabel
                }),
                PropertyPaneToggle('showAsTiles', {
                  label: strings.ShowAsTilesLabel
                })
              ]
            },
            {
              groupName: strings.TileViewGroupName,
              groupFields: [
                PropertyPaneToggle('showProjectLogo', {
                  label: strings.ShowProjectLogoFieldLabel
                }),
                PropertyPaneToggle('showProjectOwner', {
                  label: strings.ShowProjectOwnerFieldLabel
                }),
                PropertyPaneToggle('showProjectManager', {
                  label: strings.ShowProjectManagerFieldLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
