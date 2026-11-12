import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane'
import { DisplayMode } from '@microsoft/sp-core-library'
import { ISPHttpClientOptions, SPHttpClient } from '@microsoft/sp-http'
import * as strings from 'ProgramWebPartsStrings'
import _ from 'lodash'
import { createElement } from 'react'
import { ErrorWithIntent, UserMessage, renderReact } from 'pp365-shared-library'
import {
  IPortfolioAggregationConfiguration,
  IPortfolioAggregationProps,
  PortfolioAggregation
} from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import { IProgramAggregationWebPartProps } from './types'
import { BaseProgramWebPart } from '../baseProgramWebPart'

/** Hosts portfolio aggregation scoped to the program and reports configuration-loading failures. */
export default class ProgramAggregationWebPart extends BaseProgramWebPart<IProgramAggregationWebPartProps> {
  private _configuration: IPortfolioAggregationConfiguration
  private _configurationError: ErrorWithIntent

  public render(): void {
    if (!this._configuration) {
      renderReact(
        createElement(UserMessage, {
          title: this._configurationError?.name ?? strings.ErrorTitle,
          text: this._configurationError?.message,
          intent: this._configurationError?.intent ?? 'warning'
        }),
        this.domElement
      )
      return
    }
    this.renderComponent<IPortfolioAggregationProps>(PortfolioAggregation, {
      configuration: this._configuration,
      onUpdateProperty: this._onUpdateProperty.bind(this),
      isParentProject: true,
      spfxContext: this.context
    })
  }

  /**
   * Updates a property, refreshing the editor or persisting app-page properties in read mode.
   */
  private async _onUpdateProperty(key: string, value: any) {
    this.properties[key] = value
    switch (this.displayMode) {
      case DisplayMode.Edit:
        this.context.propertyPane.refresh()
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

  /** Initializes the adapter and loads aggregation configuration, retaining any error for rendering. */
  public async onInit(): Promise<void> {
    try {
      await super.onInit()
      this._configuration = await this._dataAdapter.getAggregatedListConfig(
        this.properties.dataSourceCategory,
        this.properties.dataSourceLevel
      )
    } catch (error) {
      this._configurationError = error as ErrorWithIntent
    }
  }

  /**
   * Builds default-view dropdown options from the loaded aggregation configuration.
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
                    _.find(this._configuration?.views, (v) => v.isDefault)?.id ||
                    _.first(this._configuration?.views)?.id
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
