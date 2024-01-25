import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import {
  IPortfolioOverviewConfiguration,
  IPortfolioOverviewProps
} from '../../components/PortfolioOverview'
import { PortfolioOverview } from 'components/PortfolioOverview/PortfolioOverview'

export default class PortfolioOverviewWebPart extends BasePortfolioWebPart<IPortfolioOverviewProps> {
  private _configuration: IPortfolioOverviewConfiguration

  public render(): void {
    this.renderComponent<IPortfolioOverviewProps>(PortfolioOverview, {
      configuration: this._configuration
    })
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getPortfolioConfig()
  }

  /**
   * Get dropdown options for the specified `targetProperty`. For now it only
   * handles the `defaultViewId` property, but in the future it could be used
   * to populate other dropdowns in the property pane.
   *
   * @param targetProperty Target property
   */
  protected _getOptions(targetProperty: string): IPropertyPaneDropdownOption[] {
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
                PropertyPaneToggle('showGroupBy', {
                  label: strings.ShowGroupByLabel
                }),
                PropertyPaneToggle('showFilters', {
                  label: strings.ShowFiltersLabel
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel
                }),
                this.properties.showExcelExportButton &&
                  PropertyPaneToggle('includeViewNameInExcelExportFilename', {
                    label: strings.IncludeViewNameInExcelExportFilenameLabel
                  }),
                PropertyPaneToggle('showViewSelector', {
                  label: strings.ShowViewSelectorLabel
                }),
                this.properties.showViewSelector &&
                  PropertyPaneToggle('showProgramViews', {
                    label: strings.ShowProgramViewsLabel
                  })
              ].filter(Boolean)
            },
            {
              groupName: strings.ListViewGroupName,
              groupFields: [
                PropertyPaneToggle('isListLayoutModeJustified', {
                  label: strings.ListLayoutModeJustifiedLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
