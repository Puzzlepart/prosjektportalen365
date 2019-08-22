import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle, PropertyPaneDropdown, IPropertyPaneDropdownOption, PropertyPaneSlider } from '@microsoft/sp-webpart-base';
import { IPortfolioOverviewProps, PortfolioOverview } from 'components';
import * as strings from 'PortfolioWebPartsStrings';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';
import { IPortfolioOverviewConfiguration } from 'interfaces';

export const PropertyPaneConfigurationProps = {
  COLUMN_CONFIG_LISTNAME: 'columnConfigListName',
  COLUMNS_LISTNAME: 'columnsListName',
  DEFAULT_VIEW_ID: 'defaultViewId',
  PROJECTINFO_FILTER_FIELD: 'projectInfoFilterField',
  PROJECTINFO_STATUSREPORTS_COUNT: 'projectInfoStatusReportsCount',
  PROJECTINFO_STATUSREPORTS_LINKURL_TEMPLATE: 'projectInfoStatusReportsLinkUrlTemplate',
  SHOW_COMMANDBAR: 'showCommandBar',
  SHOW_EXCELEXPORT_BUTTON: 'showExcelExportButton',
  SHOW_FILTERS: 'showFilters',
  SHOW_GROUPBY: 'showGroupBy',
  SHOW_SEARCH_BOX: 'showSearchBox',
  SHOW_VIEWSELECTOR: 'showViewSelector',
  VIEWS_LISTNAME: 'viewsListName'
};

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
      case PropertyPaneConfigurationProps.PROJECTINFO_FILTER_FIELD: {
        if (this._configuration) {
          return [{ key: null, text: '' }, ...this._configuration.showFields.map(fld => ({ key: fld.InternalName, text: fld.Title }))];
        }
      }
        break;
      case PropertyPaneConfigurationProps.DEFAULT_VIEW_ID: {
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
                PropertyPaneToggle(PropertyPaneConfigurationProps.SHOW_SEARCH_BOX, {
                  label: strings.ShowSearchBoxLabel,
                }),
                PropertyPaneDropdown(PropertyPaneConfigurationProps.DEFAULT_VIEW_ID, {
                  label: strings.DefaultViewLabel,
                  options: this.getOptions(PropertyPaneConfigurationProps.DEFAULT_VIEW_ID),
                }),
              ]
            },
            {
              groupName: strings.ProjectInformationGroupName,
              groupFields: [
                PropertyPaneDropdown(PropertyPaneConfigurationProps.PROJECTINFO_FILTER_FIELD, {
                  label: strings.ProjectInfoFilterFieldLabel,
                  options: this.getOptions(PropertyPaneConfigurationProps.PROJECTINFO_FILTER_FIELD),
                }),
                PropertyPaneSlider(PropertyPaneConfigurationProps.PROJECTINFO_STATUSREPORTS_COUNT, {
                  label: strings.ProjectInfoStatusReportsCountLabel,
                  min: 0,
                  max: 10,
                  step: 1,
                }),
                PropertyPaneTextField(PropertyPaneConfigurationProps.PROJECTINFO_STATUSREPORTS_LINKURL_TEMPLATE, {
                  label: strings.ProjectInfoStatusReportsLinkUrlTemplateLabel,
                }),
              ]
            },
            {
              groupName: strings.CommandBarGroupName,
              groupFields: [
                PropertyPaneToggle(PropertyPaneConfigurationProps.SHOW_COMMANDBAR, {
                  label: strings.ShowCommandBarLabel,
                }),
                PropertyPaneToggle(PropertyPaneConfigurationProps.SHOW_GROUPBY, {
                  label: strings.ShowGroupByLabel,
                  disabled: !this.properties.showCommandBar,
                }),
                PropertyPaneToggle(PropertyPaneConfigurationProps.SHOW_FILTERS, {
                  label: strings.ShowFiltersLabel,
                  disabled: !this.properties.showCommandBar,
                }),
                PropertyPaneToggle(PropertyPaneConfigurationProps.SHOW_EXCELEXPORT_BUTTON, {
                  label: strings.ShowExcelExportButtonLabel,
                  disabled: !this.properties.showCommandBar,
                }),
                PropertyPaneToggle(PropertyPaneConfigurationProps.SHOW_VIEWSELECTOR, {
                  label: strings.ShowViewSelectorLabel,
                  disabled: !this.properties.showCommandBar,
                }),
              ],
            },
            {
              groupName: strings.ConfigurationGroupName,
              groupFields: [
                PropertyPaneTextField(PropertyPaneConfigurationProps.COLUMN_CONFIG_LISTNAME, {
                  label: strings.ColumnConfigListNameLabel,
                }),
                PropertyPaneTextField(PropertyPaneConfigurationProps.COLUMNS_LISTNAME, {
                  label: strings.ColumnsListNameLabel,
                }),
                PropertyPaneTextField(PropertyPaneConfigurationProps.VIEWS_LISTNAME, {
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
