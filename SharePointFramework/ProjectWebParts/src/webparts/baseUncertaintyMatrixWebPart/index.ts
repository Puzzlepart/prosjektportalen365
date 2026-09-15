import { get } from '@microsoft/sp-lodash-subset'
import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'ProjectWebPartsStrings'
import _ from 'lodash'
import { mapManagedPropertiesToInternalNames } from 'pp365-shared-library'
import { FC } from 'react'
import SPDataAdapter from '../../data'
import { UncertaintyElementModel } from '../../models'
import { BaseProjectWebPart } from '../baseProjectWebPart'
import {
  IBaseUncertaintyMatrixWebPartProps,
  IUncertaintyMatrixWebPartConfig,
  IUncertaintyMatrixWebPartData
} from './types'
import resource from 'SharedResources'

/**
 * Shared base class for the Risk Matrix and Opportunity Matrix web parts. The
 * concrete web parts provide their configuration through the abstract `config`
 * getter and render their component through `renderMatrix`.
 */
export abstract class BaseUncertaintyMatrixWebPart<
  TProps extends IBaseUncertaintyMatrixWebPartProps
> extends BaseProjectWebPart<TProps> {
  protected _data: IUncertaintyMatrixWebPartData = {}
  protected _error: Error

  /**
   * Configuration for the concrete web part (content type, configuration folder,
   * default configuration setting key and default data source).
   */
  protected abstract get config(): IUncertaintyMatrixWebPartConfig

  public async onInit() {
    await super.onInit()
    try {
      const [items, configurations] = await Promise.all([
        this._getItems(),
        SPDataAdapter.getConfigurations(this.config.configurationFolder)
      ])
      const defaultConfiguration = _.find(
        configurations,
        (config) =>
          config.name === SPDataAdapter.globalSettings.get(this.config.defaultConfigurationSettingKey)
      )
      this._data = { items, configurations, defaultConfiguration }
    } catch (error) {
      this._error = error
    }
  }

  /**
   * Renders the specified matrix component with the retrieved items, or the error
   * if the initialization failed.
   *
   * @param component Matrix component to render
   */
  protected renderMatrix<P>(component: FC<P>): void {
    if (this._error) {
      this.renderError(this._error)
    } else {
      const { items, defaultConfiguration } = this._data
      this.renderComponent<P>(component, {
        ...this.properties,
        width: this.properties.fullWidth ? '100%' : this.properties.width,
        items: items,
        manualConfigurationPath:
          this.properties.manualConfigurationPath ?? defaultConfiguration?.url
      } as unknown as Partial<P>)
    }
  }

  /**
   * Get items for the matrix. Uses the data source (search aggregated over child
   * projects) or the local uncertainty list (CAML) depending on `dataFetchMode`.
   * In `auto` mode the data source is used when the current site is a parent
   * project or program and the hub is available.
   */
  protected async _getItems(): Promise<UncertaintyElementModel[]> {
    const {
      probabilityFieldName,
      consequenceFieldName,
      probabilityPostActionFieldName,
      consequencePostActionFieldName
    } = this.properties
    const items = (await this._shouldUseDataSource())
      ? await this._getItemsFromDataSource()
      : await this._getItemsFromList()
    return items.map(
      (i) =>
        new UncertaintyElementModel(
          i,
          get(i, probabilityFieldName, { default: '' }),
          get(i, consequenceFieldName, { default: '' }),
          get(i, probabilityPostActionFieldName, { default: '' }),
          get(i, consequencePostActionFieldName, { default: '' })
        )
    )
  }

  /**
   * Resolves whether to fetch items using the data source based on the
   * `dataFetchMode` property (default `auto`).
   */
  private async _shouldUseDataSource(): Promise<boolean> {
    switch (this.properties.dataFetchMode ?? 'auto') {
      case 'dataSource':
        return true
      case 'list':
        return false
      default:
        return !!(
          SPDataAdapter.portalDataService?.isAvailable && (await SPDataAdapter.isParentProject())
        )
    }
  }

  /**
   * Get items from the local uncertainty list using a CAML query filtering on the
   * content type from the web part configuration.
   */
  private async _getItemsFromList(): Promise<Record<string, any>[]> {
    const viewXml = `<View><Query><Where><Eq><FieldRef Name="ContentType" /><Value Type="Computed">${this.config.contentTypeName}</Value></Eq></Where></Query></View>`
    return await this.sp.web.lists
      .getByTitle(resource.Lists_Uncertainty_Title)
      .getItemsByCAMLQuery({ ViewXml: viewXml })
  }

  /**
   * Get items from the configured data source (or the web part's default data
   * source) using SharePoint search aggregated over the current site's child
   * projects. Optionally filters items on the "Show in portfolio" flag, and maps
   * managed properties back to internal names so field references and callout
   * templates written for list items also resolve for search results.
   */
  private async _getItemsFromDataSource(): Promise<Record<string, any>[]> {
    const dataSource = await SPDataAdapter.resolveDataSource(
      this.properties.dataSource,
      this.config.defaultDataSourceId,
      this.config.defaultDataSourceName
    )
    let items = await SPDataAdapter.fetchItemsFromDataSource(
      dataSource,
      [
        'ListItemID',
        'GtRiskStrategyOWSCHCS',
        'GtRiskProximityOWSCHCS',
        'GtRiskStatusOWSCHCS',
        'GtShowInPortfolioOWSBOOL'
      ],
      true
    )
    if (this.properties.filterByShowInPortfolio ?? true) {
      items = items.filter((item) =>
        ['1', 'true'].includes(String(item.GtShowInPortfolioOWSBOOL).toLowerCase())
      )
    }
    const fieldNameMap = new Map(
      [...(dataSource.columns ?? []), ...(dataSource.refiners ?? [])]
        .filter((column) => column.internalName && column.fieldName)
        .map((column) => [column.fieldName, column.internalName] as [string, string])
    )
    return items.map((item) => mapManagedPropertiesToInternalNames(item, fieldNameMap))
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const dataFetchMode = this.properties.dataFetchMode ?? 'auto'
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.DataGroupName,
              groupFields: [
                PropertyPaneDropdown('dataFetchMode', {
                  label: strings.DataFetchModeLabel,
                  options: [
                    { key: 'auto', text: strings.DataFetchModeAutoText },
                    { key: 'list', text: strings.DataFetchModeListText },
                    { key: 'dataSource', text: strings.DataFetchModeDataSourceText }
                  ],
                  selectedKey: dataFetchMode
                }),
                dataFetchMode !== 'list' &&
                  PropertyPaneTextField('dataSource', {
                    label: strings.DataSourceLabel,
                    description: strings.DataSourceDescription,
                    placeholder: this.config.defaultDataSourceName
                  }),
                dataFetchMode !== 'list' &&
                  PropertyPaneToggle('filterByShowInPortfolio', {
                    label: strings.FilterByShowInPortfolioLabel,
                    checked: this.properties.filterByShowInPortfolio ?? true
                  }),
                PropertyPaneTextField('listName', {
                  label: strings.ListNameFieldLabel
                }),
                PropertyPaneTextField('viewXml', {
                  label: strings.ViewXmlFieldLabel,
                  multiline: true
                }),
                PropertyPaneTextField('probabilityFieldName', {
                  label: strings.ProbabilityFieldNameFieldLabel
                }),
                PropertyPaneTextField('consequenceFieldName', {
                  label: strings.ConsequenceFieldNameFieldLabel
                }),
                PropertyPaneTextField('probabilityPostActionFieldName', {
                  label: strings.ProbabilityPostActionFieldNameFieldLabel
                }),
                PropertyPaneTextField('consequencePostActionFieldName', {
                  label: strings.ConsequencePostActionFieldNameFieldLabel
                })
              ].filter(Boolean)
            },
            {
              groupName: strings.LookAndFeelGroupName,
              groupFields: [
                PropertyPaneToggle('showTitle', {
                  label: strings.ShowTitleLabel,
                  checked: this.properties.showTitle ?? false
                }),
                this.properties.showTitle &&
                  PropertyPaneTextField('title', {
                    label: strings.TitleLabel,
                    placeholder: this.title
                  }),
                PropertyPaneToggle('fullWidth', {
                  label: strings.MatrixFullWidthLabel,
                  checked:
                    this.properties.fullWidth === undefined ? true : this.properties.fullWidth
                }),
                !this.properties.fullWidth &&
                  PropertyPaneSlider('width', {
                    label: strings.WidthFieldLabel,
                    min: 400,
                    max: 1000,
                    value: 400,
                    showValue: true
                  }),
                PropertyPaneTextField('calloutTemplate', {
                  label: strings.CalloutTemplateFieldLabel,
                  multiline: true,
                  resizable: true,
                  rows: 8
                }),
                PropertyPaneDropdown('manualConfigurationPath', {
                  label: strings.ManualConfigurationPathLabel,
                  options: (this._data.configurations ?? []).map(({ url: key, title: text }) => ({
                    key,
                    text
                  })),
                  selectedKey:
                    this.properties?.manualConfigurationPath ?? this._data.defaultConfiguration?.url
                })
              ].filter(Boolean)
            }
          ]
        }
      ]
    }
  }
}

export * from './types'
