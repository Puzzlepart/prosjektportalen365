import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base'
import { BenefitsOverview, IBenefitsOverviewProps } from 'components/BenefitsOverview'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'


export default class BenefitsOverviewWebPart extends BasePortfolioWebPart<IBenefitsOverviewProps> {
  public render(): void {
    this.renderComponent(BenefitsOverview)
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
                  label: strings.SearchBoxPlaceholderTextLabel,
                }),
                PropertyPaneTextField('dataSource', {
                  label: strings.DataSourceLabel,
                }),
                PropertyPaneTextField('dataSourceCategory', {
                  label: strings.DataSourceCategoryLabel,
                }),
                PropertyPaneToggle('showCommandBar', {
                  label: strings.ShowCommandBarLabel,
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel,
                }),
              ]
            },
          ]
        }
      ]
    }
  }
}
