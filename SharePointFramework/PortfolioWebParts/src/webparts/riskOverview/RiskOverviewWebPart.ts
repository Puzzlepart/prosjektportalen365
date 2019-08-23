import { IPropertyPaneConfiguration, PropertyPaneToggle, PropertyPaneTextField } from '@microsoft/sp-webpart-base';
import { IRiskOverviewProps, RiskOverview } from 'components';
import * as strings from 'PortfolioWebPartsStrings';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';

export default class RiskOverviewWebPart extends BasePortfolioWebPart<IRiskOverviewProps> {
  public render(): void {
    const groupByColumns = [{ name: strings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }];
    this.renderComponent(RiskOverview, { groupByColumns });
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
    };
  }
}
