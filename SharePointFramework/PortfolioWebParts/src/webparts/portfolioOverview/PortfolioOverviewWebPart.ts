import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle, PropertyPaneDropdown } from '@microsoft/sp-webpart-base';
import { IPortfolioOverviewProps, PortfolioOverview } from 'components';
import * as strings from 'PortfolioWebPartsStrings';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';
import { getPortfolioConfig } from 'data';
import { IPortfolioOverviewConfiguration } from 'interfaces';

export default class PortfolioOverviewWebPart extends BasePortfolioWebPart<IPortfolioOverviewProps> {
  private _configuration: IPortfolioOverviewConfiguration;

  public render(): void {
    this.renderComponent(PortfolioOverview, { configuration: this._configuration } as IPortfolioOverviewProps);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
    this._configuration = await getPortfolioConfig(this.properties.columnConfigListName, this.properties.columnsListName, this.properties.viewsListName);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('projectInfoFilterField', {
                  label: strings.ProjectInfoFilterFieldLabel,
                }),
                PropertyPaneToggle('excelExportEnabled', {
                  label: strings.ExcelExportEnabledLabel,
                }),
                PropertyPaneToggle('showGroupBy', {
                  label: strings.ShowGroupByLabel,
                }),
                PropertyPaneToggle('viewSelectorEnabled', {
                  label: strings.ViewSelectorEnabledLabel,
                }),
                PropertyPaneDropdown('defaultView', {
                  label: strings.DefaultViewLabel,
                  options: this._configuration
                    ? this._configuration.views.map(v => ({ key: v.id, text: v.title }))
                    : [],
                })
              ]
            },
            {
              groupName: strings.ConfigurationGroupName,
              groupFields: [
                PropertyPaneTextField('columnConfigListName', {
                  label: strings.ColumnConfigListNameLabel,
                }),
                PropertyPaneTextField('columnsListName', {
                  label: strings.ColumnsListNameLabel,
                }),
                PropertyPaneTextField('viewsListName', {
                  label: strings.ViewsListNameLabel,
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}
