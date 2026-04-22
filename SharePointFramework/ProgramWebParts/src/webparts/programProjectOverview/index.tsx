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
import { createElement } from 'react'
import { render } from 'react-dom'
import { ErrorWithIntent, UserMessage } from 'pp365-shared-library'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IProgramProjectOverviewProps } from './types'
import resource from 'SharedResources'

export default class ProgramProjectOverview extends BaseProgramWebPart<IProgramProjectOverviewProps> {
  private _configuration: IPortfolioOverviewConfiguration
  private _configurationError: ErrorWithIntent

  public render(): void {
    if (!this._configuration) {
      render(
        createElement(UserMessage, {
          title: this._configurationError?.name ?? strings.ErrorTitle,
          text: this._configurationError?.message,
          intent: this._configurationError?.intent ?? 'warning'
        }),
        this.domElement
      )
      return
    }
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
    try {
      await super.onInit()
      this._configuration = await this._dataAdapter.getPortfolioConfig()
      this.properties.title = resource.WebParts_ProgramProjectOverview_Title
    } catch (error) {
      this._configurationError = error as ErrorWithIntent
    }
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
                PropertyPaneToggle('showFilters', {
                  label: strings.ShowFiltersLabel
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel
                }),
                PropertyPaneToggle('showViewSelector', {
                  label: strings.ShowViewSelectorLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
