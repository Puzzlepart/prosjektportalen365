import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import { IIdeaModuleProps, IdeaModule } from 'components/IdeaModule'
import _ from 'lodash'
import { IPortfolioAggregationConfiguration } from 'components'
import { DisplayMode } from '@microsoft/sp-core-library'
import { ISPHttpClientOptions, SPHttpClient } from '@microsoft/sp-http'

export default class IdeaModuleWebPart extends BasePortfolioWebPart<IIdeaModuleProps> {
  private _configuration: IPortfolioAggregationConfiguration

  public render(): void {
    this.renderComponent<IIdeaModuleProps>(IdeaModule, {
      ...this.properties,
      configuration: this._configuration,
      onUpdateProperty: this._onUpdateProperty.bind(this)
    })
  }

  /**
   * On update property. For `DisplayMode.Edit` it refreshes the property pane,
   * for `DisplayMode.Read` it updates the page using the `_api/SitePages/Pages/UpdateAppPage`
   * endpoint.
   *
   * @param key Key
   * @param value Value
   */
  private async _onUpdateProperty(key: string, value: any) {
    this.properties[key] = value
    switch (this.displayMode) {
      case DisplayMode.Edit:
        {
          this.context.propertyPane.refresh()
        }
        break
      case DisplayMode.Read: {
        const options: ISPHttpClientOptions = {
          body: JSON.stringify({
            includeInNavigation: false,
            pageId: this.context.pageContext.listItem.id,
            title: this.properties.title,
            webPartDataAsJson: JSON.stringify({
              id: this.context.manifest.id,
              instanceId: this.context.instanceId,
              title: this.properties.title,
              properties: this.properties
            })
          })
        }
        await this.context.spHttpClient.post(
          `${this.context.pageContext.web.absoluteUrl}/_api/SitePages/Pages/UpdateAppPage`,
          SPHttpClient.configurations.v1,
          options
        )
      }
    }
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getAggregatedListConfig(
      this.properties.dataSourceCategory,
      this.properties.dataSourceLevel
    )
  }

  /**
   * Get view options for the property pane dropdown field `defaultViewId`.
   *
   * @param configuration Configuration
   */
  protected _getViewOptions(): IPropertyPaneDropdownOption[] {
    if (!this._configuration) return []
    return [
      { key: null, text: '' },
      ...this._configuration.views.map((view) => ({ key: view.id, text: view.title }))
    ]
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.Idea.ModuleTitle
          },
          displayGroupsAsAccordion: true,
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('configurationList', {
                  label: strings.Idea.ConfigurationListFieldLabel,
                  description: strings.Idea.ConfigurationListFieldDescription
                }),
                PropertyPaneTextField('configuration', {
                  label: strings.Idea.ConfigurationNameFieldLabel,
                  description: strings.Idea.ConfigurationNameFieldDescription
                }),
                PropertyPaneTextField('hiddenRegFields', {
                  label: strings.Idea.HiddenRegistrationFieldsLabel,
                  description: strings.Idea.HiddenRegistrationFieldsDescription,
                  disabled: true,
                  multiline: true,
                  resizable: true,
                  rows: 1
                }),
                PropertyPaneTextField('hiddenProcFields', {
                  label: strings.Idea.HiddenProcessingFieldsLabel,
                  description: strings.Idea.HiddenProcessingFieldsDescription,
                  disabled: true,
                  multiline: true,
                  resizable: true,
                  rows: 6
                }),
                PropertyPaneTextField('provisionUrl', {
                  label: strings.Idea.ProvisionUrlFieldLabel,
                  description: strings.Idea.ProvisionUrlFieldDescription
                })
              ]
            },
            {
              groupName: strings.DataSourceGroupName,
              isCollapsed: true,
              groupFields: [
                PropertyPaneTextField('dataSourceCategory', {
                  label: strings.DataSourceCategoryLabel,
                  description: strings.DataSourceCategoryDescription
                }),
                PropertyPaneTextField('dataSource', {
                  label: strings.DataSourceLabel
                }),
                PropertyPaneDropdown('dataSourceLevel', {
                  label: strings.DataSourceLevelLabel,
                  options: this._configuration?.levels.map((level) => ({
                    key: level,
                    text: level
                  })),
                  selectedKey: this.properties.dataSourceLevel ?? this._configuration?.level
                }),
                PropertyPaneDropdown('defaultViewId', {
                  label: strings.DefaultDataSourceViewLabel,
                  options: this._getViewOptions(),
                  selectedKey:
                    _.find(this._configuration.views, (v) => v.isDefault)?.id ||
                    _.first(this._configuration.views)?.id
                })
              ]
            },
            {
              groupName: strings.CommandBarGroupName,
              groupFields: [
                PropertyPaneToggle('showFilters', {
                  label: strings.ShowFiltersLabel
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel
                }),
                PropertyPaneToggle('showViewSelector', {
                  label: strings.ShowViewSelectorLabel
                })
              ]
            },
            {
              groupName: strings.ListViewGroupName,
              groupFields: [
                PropertyPaneToggle('isListLayoutModeJustified', {
                  label: strings.ListLayoutModeJustifiedLabel
                })
              ]
            },
            {
              groupName: strings.SearchBoxGroupName,
              groupFields: [
                PropertyPaneTextField('searchBoxPlaceholderText', {
                  label: strings.SearchBoxPlaceholderTextLabel,
                  description: strings.SearchBoxPlaceholderTextDescription
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
