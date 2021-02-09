import {
  IPropertyPaneConfiguration,
  PropertyPaneToggle,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base'
import { DeliveriesOverview, IDeliveriesOverviewProps } from 'components/DeliveriesOverview'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../@basePortfolioWebPart'

export default class DeliveriesOverviewWebPart extends BasePortfolioWebPart<
  IDeliveriesOverviewProps
> {
  public render(): void {
    this.renderComponent(DeliveriesOverview)
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
