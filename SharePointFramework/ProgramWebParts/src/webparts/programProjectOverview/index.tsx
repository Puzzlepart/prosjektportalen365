import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { IPortfolioOverviewConfiguration, PortfolioOverview } from 'pp365-portfoliowebparts/lib/components/PortfolioOverview'
import { PROPERTYPANE_CONFIGURATION_PROPS } from 'pp365-portfoliowebparts/lib/webparts/portfolioOverview'
import * as strings from 'ProgramWebPartsStrings'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IProgramProjectOverviewProps } from './types'

export default class ProgramProjectOverview extends BaseProgramWebPart<IProgramProjectOverviewProps> {
  private _configuration: IPortfolioOverviewConfiguration

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getPortfolioConfig()
  }

  public render(): void {
    render(
      <PortfolioOverview
        title={this.properties.title}
        pageContext={this.context.pageContext as any}
        configuration={this._configuration}
        dataAdapter={this.dataAdapter}
        showCommandBar={this.properties.showCommandBar}
        showExcelExportButton={this.properties.showExcelExportButton}
        showFilters={this.properties.showFilters}
        showViewSelector={this.properties.showViewSelector}
        showGroupBy={this.properties.showGroupBy}
        showSearchBox={this.properties.showSearchBox}
        isParentProject={true}
      />,
      this.domElement
    )
  }

  protected onDispose(): void {
    unmountComponentAtNode(this.domElement)
  }

  protected _getOptions(targetProperty: string): IPropertyPaneDropdownOption[] {
    // eslint-disable-next-line default-case
    switch (targetProperty) {
      case PROPERTYPANE_CONFIGURATION_PROPS.DEFAULT_VIEW_ID:
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
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_SEARCH_BOX, {
                  label: strings.ShowSearchBoxLabel
                }),
                PropertyPaneDropdown(PROPERTYPANE_CONFIGURATION_PROPS.DEFAULT_VIEW_ID, {
                  label: strings.DefaultViewLabel,
                  options: this._getOptions(PROPERTYPANE_CONFIGURATION_PROPS.DEFAULT_VIEW_ID)
                })
              ]
            },
            {
              groupName: strings.CommandBarGroupName,
              groupFields: [
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_COMMANDBAR, {
                  label: strings.ShowCommandBarLabel
                }),
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_GROUPBY, {
                  label: strings.ShowGroupByLabel,
                  disabled: !this.properties.showCommandBar
                }),
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_FILTERS, {
                  label: strings.ShowFiltersLabel,
                  disabled: !this.properties.showCommandBar
                }),
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_EXCELEXPORT_BUTTON, {
                  label: strings.ShowExcelExportButtonLabel,
                  disabled: !this.properties.showCommandBar
                }),
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_VIEWSELECTOR, {
                  label: strings.ShowViewSelectorLabel,
                  disabled: !this.properties.showCommandBar
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
