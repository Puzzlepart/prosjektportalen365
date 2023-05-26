import { IPropertyPaneConfiguration, IPropertyPaneDropdownOption, PropertyPaneDropdown, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane'
import strings from 'ProgramWebPartsStrings'
import _, { first } from 'lodash'
import {
  IPortfolioAggregationProps,
  PortfolioAggregation
} from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import { IAggregatedListConfiguration } from 'pp365-portfoliowebparts/lib/interfaces'
import { BaseProgramWebPart } from 'webparts/baseProgramWebPart'
import { IProgramAggregationWebPartProps } from './types'

export default class ProgramAggregationWebPart extends BaseProgramWebPart<IProgramAggregationWebPartProps> {
  private _configuration: IAggregatedListConfiguration

  public render(): void {
    this.renderComponent<IPortfolioAggregationProps>(PortfolioAggregation, {
      ...this.properties,
      dataAdapter: this.dataAdapter,
      onUpdateProperty: this._onUpdateProperty.bind(this),
      configuration: this._configuration
    })
  }

  /**
   * On update property. Sets `key` to `value` and refreshes the property pane
   * using `this.context.propertyPane.refresh()`
   *
   * @param key Key
   * @param value Value
   */
  private _onUpdateProperty(key: string, value: any) {
    this.properties[key] = value
    this.context.propertyPane.refresh()
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getAggregatedListConfig(
      this.properties.dataSourceCategory,
      this.properties.dataSourceLevel
    )
  }

  /**
   * Get view options
   *
   * @param configuration Configuration
   */
  protected _getViewOptions(): IPropertyPaneDropdownOption[] {
    if (!this._configuration) return []
    return [...this._configuration.views.map((view) => ({ key: view.id, text: view.title }))]
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.DataSourceGroupName,
              groupFields: [
                PropertyPaneTextField('dataSourceCategory', {
                  label: strings.DataSourceCategoryLabel,
                  description: strings.DataSourceCategoryDescription
                }),
                PropertyPaneTextField('dataSourceLevel', {
                  label: strings.DataSourceLevelLabel,
                  description: strings.DataSourceLevelDescription,
                  placeholder: this._configuration?.level
                }),
                PropertyPaneDropdown('defaultViewId', {
                  label: strings.DefaultDataSourceViewLabel,
                  options: this._getViewOptions(),
                  selectedKey:
                    _.find(this._configuration.views, (v) => v.isDefault)?.id ||
                    first(this._configuration.views).id
                })
              ]
            },
            {
              groupName: strings.CommandBarGroupName,
              groupFields: [
                PropertyPaneToggle('showCommandBar', {
                  label: strings.ShowCommandBarLabel
                }),
                PropertyPaneToggle('showFilters', {
                  label: strings.ShowFiltersLabel,
                  disabled: !this.properties.showCommandBar
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel,
                  disabled: !this.properties.showCommandBar
                }),
                PropertyPaneToggle('showViewSelector', {
                  label: strings.ShowViewSelectorLabel,
                  disabled: !this.properties.showCommandBar
                })
              ]
            },
            {
              groupName: strings.SearchBoxGroupName,
              groupFields: [
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel
                }),
                PropertyPaneTextField('searchBoxPlaceholderText', {
                  label: strings.SearchBoxPlaceholderTextLabel,
                  description: strings.SearchBoxPlaceholderTextDescription,
                  disabled: !this.properties.showSearchBox
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
