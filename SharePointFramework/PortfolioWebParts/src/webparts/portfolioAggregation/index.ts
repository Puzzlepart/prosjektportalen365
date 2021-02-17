import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { PortfolioAggregation, IPortfolioAggregationProps } from 'components/PortfolioAggregation'
import { DataAdapter } from 'data'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'

export default class PortfolioAggregationWebPart extends BasePortfolioWebPart<
  IPortfolioAggregationProps
> {
  constructor() {
    super()
    this._onUpdateProperty = this._onUpdateProperty.bind(this)
  }

  public render(): void {
    this.renderComponent(PortfolioAggregation, {
      ...this.properties,
      dataAdapter: new DataAdapter(this.context),
      onUpdateProperty: this._onUpdateProperty
    })
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
                  label: strings.DataSourceLabel
                }),
                PropertyPaneTextField('dataSourceCategory', {
                  label: strings.DataSourceCategoryLabel
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
