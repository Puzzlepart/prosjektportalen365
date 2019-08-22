import { IPropertyPaneConfiguration, IPropertyPaneDropdownOption, PropertyPaneDropdown, PropertyPaneSlider, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base';
import { IPortfolioOverviewProps, PortfolioOverview } from 'components';
import { IPortfolioOverviewConfiguration } from 'interfaces';
import * as strings from 'PortfolioWebPartsStrings';
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart';
import { ConstrainMode, DetailsListLayoutMode } from 'office-ui-fabric-react/lib/DetailsList';

export const PropertyPaneConfigurationProps = {
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
  CONSTRAIN_MODE: 'constrainMode',
  LAYOUT_MODE: 'layoutMode'
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
      case PropertyPaneConfigurationProps.CONSTRAIN_MODE: {
        return [
          {
            key: ConstrainMode.horizontalConstrained,
            text: 'horizontalConstrained',
          },
          {
            key: ConstrainMode.unconstrained,
            text: 'unconstrained',
          }
        ];
      }
      case PropertyPaneConfigurationProps.LAYOUT_MODE: {
        return [
          {
            key: DetailsListLayoutMode.fixedColumns,
            text: 'fixedColumns',
          },
          {
            key: DetailsListLayoutMode.justified,
            text: 'justified',
          }
        ];
      }
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
                PropertyPaneTextField(PropertyPaneConfigurationProps.STATUSREPORTS_LISTNAME, {
                  label: strings.StatusReportsListNameLabel,
                }),
                PropertyPaneSlider(PropertyPaneConfigurationProps.STATUSREPORTS_COUNT, {
                  label: strings.StatusReportsCountLabel,
                  min: 0,
                  max: 10,
                  step: 1,
                }),
                PropertyPaneTextField(PropertyPaneConfigurationProps.STATUSREPORTS_LINKURLTEMPLATE, {
                  label: strings.StatusReportsLinkUrlTemplateLabel,
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
            },
            {
              groupName: strings.AdvancedGroupName,
              groupFields: [
                PropertyPaneDropdown(PropertyPaneConfigurationProps.CONSTRAIN_MODE, {
                  label: 'ConstrainMode',
                  options: this.getOptions(PropertyPaneConfigurationProps.CONSTRAIN_MODE),
                }),
                PropertyPaneDropdown(PropertyPaneConfigurationProps.LAYOUT_MODE, {
                  label: 'DetailsListLayoutMode',
                  options: this.getOptions(PropertyPaneConfigurationProps.LAYOUT_MODE),
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}
