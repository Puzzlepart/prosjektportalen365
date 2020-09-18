import { IPropertyPaneConfiguration, IPropertyPaneDropdownOption, PropertyPaneDropdown, PropertyPaneSlider, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base'
import { PortfolioOverview, IPortfolioOverviewProps } from 'components/PortfolioOverview'
import { IPortfolioConfiguration } from 'interfaces'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'

export const PROPERTYPANE_CONFIGURATION_PROPS = {
  COLUMN_CONFIG_LISTNAME: 'columnConfigListName',
  COLUMNS_LISTNAME: 'columnsListName',
  DEFAULT_VIEW_ID: 'defaultViewId',
  STATUSREPORTS_COUNT: 'statusReportsCount',
  SHOW_COMMANDBAR: 'showCommandBar',
  SHOW_EXCELEXPORT_BUTTON: 'showExcelExportButton',
  SHOW_FILTERS: 'showFilters',
  SHOW_GROUPBY: 'showGroupBy',
  SHOW_SEARCH_BOX: 'showSearchBox',
  SHOW_VIEWSELECTOR: 'showViewSelector',
  VIEWS_LISTNAME: 'viewsListName',
}

export default class PortfolioOverviewWebPart extends BasePortfolioWebPart<IPortfolioOverviewProps> {
  private _configuration: IPortfolioConfiguration;

  public render(): void {
    this.renderComponent(PortfolioOverview, { configuration: this._configuration } as IPortfolioOverviewProps)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getPortfolioConfig()
  }

  /**
   * Get options for PropertyPaneDropdown
   * 
   * @param {string} targetProperty Target property
   */
  protected _getOptions(targetProperty: string): IPropertyPaneDropdownOption[] {
    // eslint-disable-next-line default-case
    switch (targetProperty) {
      case PROPERTYPANE_CONFIGURATION_PROPS.DEFAULT_VIEW_ID: {
        if (this._configuration) {
          return [{ key: null, text: '' }, ...this._configuration.views.map(view => ({ key: view.id, text: view.title }))]
        }
      }
        break
    }
    return []
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
                PropertyPaneSlider(PROPERTYPANE_CONFIGURATION_PROPS.STATUSREPORTS_COUNT, {
                  label: strings.StatusReportsCountLabel,
                  min: 0,
                  max: 10,
                  step: 1,
                }),
              ]
            },
          ]
        },
        {
          groups: [
            {
              groupName: strings.ConfigurationGroupName,
              groupFields: [
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.COLUMN_CONFIG_LISTNAME, {
                  label: strings.ColumnConfigListNameLabel,
                  disabled: true,
                }),
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.COLUMNS_LISTNAME, {
                  label: strings.ColumnsListNameLabel,
                  disabled: true,
                }),
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.VIEWS_LISTNAME, {
                  label: strings.ViewsListNameLabel,
                  disabled: true,
                }),
              ]
            },
          ]
        }
      ]
    }
  }
}
