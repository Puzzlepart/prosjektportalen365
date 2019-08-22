import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle, PropertyPaneDropdown } from '@microsoft/sp-webpart-base';
import { IPortfolioOverviewProps, PortfolioOverview } from 'components';
import * as strings from 'PortfolioWebPartsStrings';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';
import { IPortfolioOverviewConfiguration } from 'interfaces';

export default class PortfolioOverviewWebPart extends BasePortfolioWebPart<IPortfolioOverviewProps> {
  private _configuration: IPortfolioOverviewConfiguration;

  public render(): void {
    this.renderComponent(PortfolioOverview, { configuration: this._configuration } as IPortfolioOverviewProps);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
    this._configuration = await this.dataAdapter.getPortfolioConfig(this.properties.columnConfigListName, this.properties.columnsListName, this.properties.viewsListName);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneDropdown('projectInfoFilterField', {
                  label: strings.ProjectInfoFilterFieldLabel,
                  options: this._configuration ? this._configuration.showFields.map(fld => ({ key: fld.InternalName, text: fld.Title })) : [],
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
                PropertyPaneDropdown('defaultViewId', {
                  label: strings.DefaultViewLabel,
                  options: this._configuration ? this._configuration.views.map(view => ({ key: view.id, text: view.title })) : [],
                }),
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
