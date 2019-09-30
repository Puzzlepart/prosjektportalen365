import { IPropertyPaneConfiguration, IPropertyPaneDropdownOption, PropertyPaneDropdown, PropertyPaneSlider, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base';
import { IPortfolioOverviewProps, PortfolioOverview } from 'components';
import { IPortfolioOverviewConfiguration } from 'interfaces';
import * as strings from 'PortfolioWebPartsStrings';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';

export const PROPERTYPANE_CONFIGURATION_PROPS = {
  COLUMN_CONFIG_LISTNAME: 'columnConfigListName',
  COLUMNS_LISTNAME: 'columnsListName',
  DEFAULT_VIEW_ID: 'defaultViewId',
  PROJECTINFO_FILTER_FIELD: 'projectInfoFilterField',
  STATUSREPORTS_COUNT: 'statusReportsCount',
  STATUSREPORTS_LINKURLTEMPLATE: 'statusReportsLinkUrlTemplate',
  STATUSREPORTS_LISTNAME: 'statusReportsListName',
  SHOW_COMMANDBAR: 'showCommandBar',
  SHOW_EXCELEXPORT_BUTTON: 'showExcelExportButton',
  SHOW_FILTERS: 'showFilters',
  SHOW_GROUPBY: 'showGroupBy',
  SHOW_SEARCH_BOX: 'showSearchBox',
  SHOW_VIEWSELECTOR: 'showViewSelector',
  VIEWS_LISTNAME: 'viewsListName',
};

export default class PortfolioOverviewWebPart extends BasePortfolioWebPart<IPortfolioOverviewProps> {
  private _configuration: IPortfolioOverviewConfiguration;

  public render(): void {
    this.renderComponent(PortfolioOverview, { configuration: this._configuration } as IPortfolioOverviewProps);
  }

  public async onInit(): Promise<void> {
    await super.onInit();
    this._configuration = await this.dataAdapter.getPortfolioConfig(this.properties.columnConfigListName, this.properties.columnsListName, this.properties.viewsListName);
  }

  /**
   * Get options for PropertyPaneDropdown
   * 
   * @param {string} targetProperty Target property
   */
  protected _getOptions(targetProperty: string): IPropertyPaneDropdownOption[] {
    switch (targetProperty) {
      case PROPERTYPANE_CONFIGURATION_PROPS.PROJECTINFO_FILTER_FIELD: {
        if (this._configuration) {
          return [{ key: null, text: '' }, ...this._configuration.showFields.map(fld => ({ key: fld.InternalName, text: fld.Title }))];
        }
      }
        break;
      case PROPERTYPANE_CONFIGURATION_PROPS.DEFAULT_VIEW_ID: {
        if (this._configuration) {
          return [{ key: null, text: '' }, ...this._configuration.views.map(view => ({ key: view.id, text: view.title }))];
        }
      }
        break;
    }
    return [];
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_SEARCH_BOX, {
                  label: strings.ShowSearchBoxLabel,
                }),
                PropertyPaneDropdown(PROPERTYPANE_CONFIGURATION_PROPS.DEFAULT_VIEW_ID, {
                  label: strings.DefaultViewLabel,
                  options: this._getOptions(PROPERTYPANE_CONFIGURATION_PROPS.DEFAULT_VIEW_ID),
                }),
              ]
            },
            {
              groupName: strings.CommandBarGroupName,
              groupFields: [
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_COMMANDBAR, {
                  label: strings.ShowCommandBarLabel,
                }),
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_GROUPBY, {
                  label: strings.ShowGroupByLabel,
                  disabled: !this.properties.showCommandBar,
                }),
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_FILTERS, {
                  label: strings.ShowFiltersLabel,
                  disabled: !this.properties.showCommandBar,
                }),
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_EXCELEXPORT_BUTTON, {
                  label: strings.ShowExcelExportButtonLabel,
                  disabled: !this.properties.showCommandBar,
                }),
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_VIEWSELECTOR, {
                  label: strings.ShowViewSelectorLabel,
                  disabled: !this.properties.showCommandBar,
                }),
              ],
            },
            {
              groupName: strings.ProjectInformationGroupName,
              groupFields: [
                PropertyPaneDropdown(PROPERTYPANE_CONFIGURATION_PROPS.PROJECTINFO_FILTER_FIELD, {
                  label: strings.ProjectInfoFilterFieldLabel,
                  options: this._getOptions(PROPERTYPANE_CONFIGURATION_PROPS.PROJECTINFO_FILTER_FIELD),
                }),
                PropertyPaneSlider(PROPERTYPANE_CONFIGURATION_PROPS.STATUSREPORTS_COUNT, {
                  label: strings.StatusReportsCountLabel,
                  min: 0,
                  max: 10,
                  step: 1,
                }),
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.STATUSREPORTS_LISTNAME, {
                  label: strings.StatusReportsListNameLabel,
                  disabled: this.properties.statusReportsCount === 0,
                }),
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.STATUSREPORTS_LINKURLTEMPLATE, {
                  label: strings.StatusReportsLinkUrlTemplateLabel,
                  disabled: this.properties.statusReportsCount === 0,
                }),
              ]
            },
            {
              groupName: strings.ConfigurationGroupName,
              groupFields: [
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.COLUMN_CONFIG_LISTNAME, {
                  label: strings.ColumnConfigListNameLabel,
                }),
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.COLUMNS_LISTNAME, {
                  label: strings.ColumnsListNameLabel,
                }),
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.VIEWS_LISTNAME, {
                  label: strings.ViewsListNameLabel,
                }),
              ]
            },
          ]
        }
      ]
    };
  }
}
