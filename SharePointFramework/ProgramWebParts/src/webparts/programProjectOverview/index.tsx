import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import {
  IPortfolioOverviewConfiguration,
  PortfolioOverview
} from 'pp365-portfoliowebparts/lib/components/PortfolioOverview'
import * as strings from 'ProgramWebPartsStrings'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IProgramProjectOverviewProps } from './types'

export default class ProgramProjectOverview extends BaseProgramWebPart<IProgramProjectOverviewProps> {
  private _configuration: IPortfolioOverviewConfiguration

  public render(): void {
    render(
      <PortfolioOverview
        {...this.properties}
        pageContext={this.context.pageContext as any}
        configuration={this._configuration}
        dataAdapter={this.dataAdapter}
        isParentProject={true}
      />,
      this.domElement
    )
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getPortfolioConfig()
  }

  protected onDispose(): void {
    unmountComponentAtNode(this.domElement)
  }

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
