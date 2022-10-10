import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { PortfolioOverview } from 'pp365-portfoliowebparts/lib/components/PortfolioOverview'
import { IPortfolioConfiguration } from 'pp365-portfoliowebparts/lib/interfaces'
import { PROPERTYPANE_CONFIGURATION_PROPS } from 'pp365-portfoliowebparts/lib/webparts/portfolioOverview'
import * as strings from 'ProgramWebPartsStrings'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IProgramStatusWebPartProps } from './types'

export default class ProgramStatusWebPart extends BaseProgramWebPart<IProgramStatusWebPartProps> {
  private _configuration: IPortfolioConfiguration

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getPortfolioConfig()
  }

  public render(): void {
    render(
      <>
        <PortfolioOverview
          title={this.pageTitle ?? this.properties.title}
          pageContext={this.context.pageContext}
          configuration={this._configuration}
          dataAdapter={this.dataAdapter}
          defaultViewId={this.properties.defaultViewId}
          showCommandBar={this.properties.showCommandBar}
          showExcelExportButton={this.properties.showExcelExportButton}
          showFilters={this.properties.showFilters}
          showViewSelector={this.properties.showViewSelector}
          showGroupBy={this.properties.showGroupBy}
          showSearchBox={this.properties.showSearchBox}
          isParentProject={true}
        />
      </>,
      this.domElement
    )
  }

  protected onDispose(): void {
    unmountComponentAtNode(this.domElement)
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
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.DEFAULT_VIEW_ID, {
                  label: strings.ProgramStatus_ViewIdLabel
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
                })
              ]
            }
          ]
        },
        {
          groups: [
            {
              groupName: strings.ConfigurationGroupName,
              groupFields: [
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.COLUMN_CONFIG_LISTNAME, {
                  label: strings.ColumnConfigListNameLabel,
                  disabled: true
                }),
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.COLUMNS_LISTNAME, {
                  label: strings.ColumnsListNameLabel,
                  disabled: true
                }),
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.VIEWS_LISTNAME, {
                  label: strings.ViewsListNameLabel,
                  disabled: true
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
