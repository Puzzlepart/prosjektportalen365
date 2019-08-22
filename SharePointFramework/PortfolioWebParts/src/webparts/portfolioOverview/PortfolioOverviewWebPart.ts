import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle, PropertyPaneDropdown, IPropertyPaneDropdownOption } from '@microsoft/sp-webpart-base';
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

  /**
   * Get options for PropertyPaneDropdown
   * 
   * @param {string} targetProperty Target property
   */
  protected getOptions(targetProperty: string): IPropertyPaneDropdownOption[] {
    switch (targetProperty) {
      case 'projectInfoFilterField': {
        if (this._configuration) {
          return [{ key: null, text: '' }, ...this._configuration.showFields.map(fld => ({ key: fld.InternalName, text: fld.Title }))];
        }
      }
        break;
      case 'defaultViewId': {
        if (this._configuration) {
          return [{ key: null, text: '' }, ...this._configuration.views.map(view => ({ key: view.id, text: view.title }))];
        }
      }
        break;
    }
    return [];
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel,
                }),
                PropertyPaneDropdown('projectInfoFilterField', {
                  label: strings.ProjectInfoFilterFieldLabel,
                  options: this.getOptions('projectInfoFilterField'),
                }),
                PropertyPaneDropdown('defaultViewId', {
                  label: strings.DefaultViewLabel,
                  options: this.getOptions('defaultViewId'),
                }),
              ]
            },
            {
              groupName: strings.CommandBarGroupName,
              groupFields: [
                PropertyPaneToggle('showCommandBar', {
                  label: strings.ShowCommandBarLabel,
                }),
                PropertyPaneToggle('showGroupBy', {
                  label: strings.ShowGroupByLabel,
                  disabled: !this.properties.showCommandBar,
                }),
                PropertyPaneToggle('showFilters', {
                  label: strings.ShowFiltersLabel,
                  disabled: !this.properties.showCommandBar,
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel,
                  disabled: !this.properties.showCommandBar,
                }),
                PropertyPaneToggle('showViewSelector', {
                  label: strings.ShowViewSelectorLabel,
                  disabled: !this.properties.showCommandBar,
                }),
              ],
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
