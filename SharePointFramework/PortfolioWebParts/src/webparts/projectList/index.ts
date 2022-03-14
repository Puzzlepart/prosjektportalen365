import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { IProjectListProps, ProjectList } from 'components/ProjectList'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'
import { taxonomy } from '@pnp/sp-taxonomy'

export default class ProjectListWebPart extends BasePortfolioWebPart<IProjectListProps> {
  public render(): void {
    console.log(this.properties);
    this.renderComponent<IProjectListProps>(ProjectList)
  }

  private async _setupTaxonomy() {
    taxonomy.setup({spfxContext: this.context})
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    await this._setupTaxonomy()
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
                }),
                PropertyPaneToggle('showLifeCycleStatus', {
                  label: strings.ShowLifeCycleStatusFieldLabel,
                }),
                PropertyPaneToggle('showServiceArea', {
                  label: strings.ShowServiceAreaFieldLabel
                }),
                PropertyPaneToggle('showType', {
                  label: strings.ShowTypeFieldLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
