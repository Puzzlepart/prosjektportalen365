import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { IPortfolioAggregationProps, PortfolioAggregation } from 'components/PortfolioAggregation'
import { DataAdapter } from 'data'
import { IMessageBarProps, MessageBar } from 'office-ui-fabric-react/lib/MessageBar'
import * as strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'

export default class PortfolioAggregationWebPart extends BasePortfolioWebPart<
  IPortfolioAggregationProps
> {
  public render(): void {
    if (!this.properties.dataSource) {
      this.renderComponent<IMessageBarProps>(MessageBar, {
        children: <span>{strings.PortfolioAggregationNotConfiguredMessage}</span>
      })
    } else {
      this.renderComponent<IPortfolioAggregationProps>(PortfolioAggregation, {
        ...this.properties,
        dataAdapter: new DataAdapter(this.context),
        onUpdateProperty: this._onUpdateProperty.bind(this)
      })
    }
  }

  /**
   * On update property
   *
   * @param {string} key Key
   * @param {any} value Value
   */
  private _onUpdateProperty(key: string, value: any) {
    this.properties[key] = value
    this.context.propertyPane.refresh()
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
              groupName: strings.DataSourceGroupName,
              groupFields: [
                PropertyPaneTextField('dataSource', {
                  label: strings.DataSourceLabel,
                  description: strings.DataSourceDescription
                }),
                PropertyPaneTextField('dataSourceCategory', {
                  label: strings.DataSourceCategoryLabel,
                  description: strings.DataSourceCategoryDescription
                })
              ]
            },
            {
              groupName: strings.CommandBarGroupName,
              groupFields: [
                PropertyPaneToggle('showCommandBar', {
                  label: strings.ShowCommandBarLabel
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel,
                  disabled: !this.properties.showCommandBar
                })
              ]
            },
            {
              groupName: strings.SearchBoxGroupName,
              groupFields: [
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel
                }),
                PropertyPaneTextField('searchBoxPlaceholderText', {
                  label: strings.SearchBoxPlaceholderTextLabel,
                  disabled: !this.properties.showSearchBox
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
