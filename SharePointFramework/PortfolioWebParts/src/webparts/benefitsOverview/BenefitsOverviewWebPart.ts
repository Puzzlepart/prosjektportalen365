import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base';
import { BenefitsOverview, IBenefitsOverviewProps } from 'components';
import * as strings from 'PortfolioWebPartsStrings';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';


export default class BenefitsOverviewWebPart extends BasePortfolioWebPart<IBenefitsOverviewProps> {
  public render(): void {
    this.renderComponent(BenefitsOverview);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
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
                  disabled: true,
                }),
                PropertyPaneTextField('dataSourceCategory', {
                  label: strings.DataSourceCategoryLabel,
                  disabled: true,
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
    };
  }
}
