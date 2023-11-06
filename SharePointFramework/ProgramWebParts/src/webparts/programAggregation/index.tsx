import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane'
import strings from 'ProgramWebPartsStrings'
import _ from 'lodash'
import {
  IPortfolioAggregationConfiguration,
  IPortfolioAggregationProps,
  PortfolioAggregation
} from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IProgramAggregationWebPartProps } from './types'

export default class ProgramAggregationWebPart extends BaseProgramWebPart<IProgramAggregationWebPartProps> {
  private _configuration: IPortfolioAggregationConfiguration

  public render(): void {
    this.renderComponent<IPortfolioAggregationProps>(PortfolioAggregation, {
      onUpdateProperty: this._onUpdateProperty.bind(this),
      configuration: this._configuration,
      isParentProject: true,
      spfxContext: this.context,
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

  /**
   * Initializes the web part. Overrides the base `onInit` method to retrieve the configuration
   * for the aggregated list from the data adapter.
   *
   * @returns A promise that resolves when the initialization is complete.
   */
  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this._dataAdapter.getAggregatedListConfig(
      this.properties.dataSourceCategory,
      this.properties.dataSourceLevel
    )
  }

  /**
   * Get view options for the property pane dropdown 'defaultViewId'.
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
                    _.first(this._configuration.views).id
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
