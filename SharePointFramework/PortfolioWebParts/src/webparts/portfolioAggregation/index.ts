import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { PortfolioAggregation, IPortfolioAggregationProps } from 'components/PortfolioAggregation'
import { DataAdapter } from 'data'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'

export default class PortfolioAggregationWebPart extends BasePortfolioWebPart<IPortfolioAggregationProps> {
  public render(): void {
    this.renderComponent(PortfolioAggregation, {
      ...this.properties,
      dataAdapter: new DataAdapter(this.context)
    })
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
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('searchBoxPlaceholderText', {
                  label: strings.SearchBoxPlaceholderTextLabel
                }),
                PropertyPaneTextField('dataSource', {
                  label: strings.DataSourceLabel
                }),
                PropertyPaneTextField('dataSourceCategory', {
                  label: strings.DataSourceCategoryLabel
                }),
                PropertyPaneToggle('showCommandBar', {
                  label: strings.ShowCommandBarLabel
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
