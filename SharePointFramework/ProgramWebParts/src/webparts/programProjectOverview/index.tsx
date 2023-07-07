import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'ProgramWebPartsStrings'
import {
  IPortfolioOverviewConfiguration,
  PortfolioOverview
} from 'pp365-portfoliowebparts/lib/components/PortfolioOverview'
import { unmountComponentAtNode } from 'react-dom'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IProgramProjectOverviewProps } from './types'

export default class ProgramProjectOverview extends BaseProgramWebPart<IProgramProjectOverviewProps> {
  private _configuration: IPortfolioOverviewConfiguration

  public render(): void {
    this.renderComponent(PortfolioOverview, {
      isParentProject: true,
      configuration: this._configuration
    })
  }

  /**
   * Initializes the web part. This method is called when the web part is first loaded on the page.
   * It calls the base `onInit` method and then retrieves the portfolio configuration from the data adapter.
   *
   * @returns A promise that resolves when the initialization is complete.
   */
  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this._dataAdapter.getPortfolioConfig()
  }

  protected onDispose(): void {
    unmountComponentAtNode(this.domElement)
  }

  /**
   * Returns an array of dropdown options for the specified target property.
   *
   * @param targetProperty The target property for which to retrieve dropdown options.
   *
   * @returns An array of dropdown options for the specified target property.
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
                  PropertyPaneToggle('showViewSelector', {
                    label: strings.ShowViewSelectorLabel
                  })
              ].filter(Boolean)
            }
          ]
        }
      ]
    }
  }
}
