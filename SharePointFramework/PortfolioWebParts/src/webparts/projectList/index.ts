import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls'
import { IProjectListProps, ProjectList } from 'components/ProjectList'
import { ProjectListViews } from 'components/ProjectList/ProjectListViews'
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
    const viewOptions = ProjectListViews.map<IPropertyPaneDropdownOption>(
      (view) => ({
        key: view.itemKey,
        text: view.headerText
      })
    )
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
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel
                }),
                PropertyPaneToggle('showViewSelector', {
                  label: strings.ShowViewSelectorLabel
                }),
                PropertyPaneDropdown('defaultView', {
                  label: strings.DefaultViewLabel,
                  options: viewOptions
                }),
                PropertyFieldMultiSelect('hideViews', {
                  key: 'hideViews',
                  label: strings.HideViewsLabel,
                  options: viewOptions,
                  selectedKeys: this.properties.hideViews ?? []
                }),
                PropertyPaneDropdown('defaultRenderMode', {
                  label: strings.DefaultRenderModeLabel,
                  options: [
                    {
                      key: 'list',
                      text: strings.RenderModeListText
                    },
                    {
                      key: 'tiles',
                      text: strings.RenderModeTilesText
                    }
                  ]
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
