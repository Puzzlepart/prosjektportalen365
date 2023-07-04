import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'
import {
  IPortfolioOverviewConfiguration,
  IPortfolioOverviewProps,
  PortfolioOverview
} from '../../components/PortfolioOverview'

export default class PortfolioOverviewWebPart extends BasePortfolioWebPart<IPortfolioOverviewProps> {
  private _configuration: IPortfolioOverviewConfiguration

  public render(): void {
    this.renderComponent<IPortfolioOverviewProps>(PortfolioOverview, {
      configuration: this._configuration
    } as IPortfolioOverviewProps)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getPortfolioConfig()
  }

  /**
   * Get dropdown options for the specified `targetProperty`.
   *
   * @param targetProperty Target property
   */
  protected _getOptions(targetProperty: string): IPropertyPaneDropdownOption[] {
    // eslint-disable-next-line default-case
    switch (targetProperty) {
      case 'defaultViewId':
        {
          if (this._configuration) {
            return [
              { key: null, text: '' },
              ...this._configuration.views.map((view) => ({ key: view.id, text: view.title }))
            ]
          }
        }
        break
    }
    return []
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel
                }),
                PropertyPaneDropdown('defaultViewId', {
                  label: strings.DefaultViewLabel,
                  options: this._getOptions('defaultViewId')
                })
              ]
            },
            {
              groupName: strings.CommandBarGroupName,
              groupFields: [
                PropertyPaneToggle('showCommandBar', {
                  label: strings.ShowCommandBarLabel
                }),
                this.properties.showCommandBar &&
                  PropertyPaneToggle('showGroupBy', {
                    label: strings.ShowGroupByLabel
                  }),
                this.properties.showCommandBar &&
                  PropertyPaneToggle('showFilters', {
                    label: strings.ShowFiltersLabel
                  }),
                this.properties.showCommandBar &&
                  PropertyPaneToggle('showExcelExportButton', {
                    label: strings.ShowExcelExportButtonLabel
                  }),
                this.properties.showCommandBar &&
                  this.properties.showExcelExportButton &&
                  PropertyPaneToggle('includeViewNameInExcelExportFilename', {
                    label: strings.IncludeViewNameInExcelExportFilenameLabel
                  }),
                this.properties.showCommandBar &&
                  PropertyPaneToggle('showViewSelector', {
                    label: strings.ShowViewSelectorLabel
                  }),
                this.properties.showCommandBar &&
                  this.properties.showViewSelector &&
                  PropertyPaneToggle('showProgramViews', {
                    label: strings.ShowProgramViewsLabel
                  })
              ].filter(Boolean)
            },
            {
              groupName: strings.ProjectInformationGroupName,
              groupFields: [
                PropertyPaneSlider('statusReportsCount', {
                  label: strings.StatusReportsCountLabel,
                  min: 0,
                  max: 10,
                  step: 1
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
