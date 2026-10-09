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
import { mapManagedPropertiesToInternalNames, unmountReact } from 'pp365-shared-library'
import { FC } from 'react'
import { DEFAULT_MATRIX_WIDTH } from '../../components/DynamicMatrix/types'
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
 * The properties that decide which items the matrix shows and where they are placed. A change to
 * one of them in the property pane fetches the items again.
 */
const DATA_PROPERTIES: string[] = [
  'dataFetchMode',
  'dataSource',
  'filterByShowInPortfolio',
  'listName',
  'viewXml',
  'probabilityFieldName',
  'consequenceFieldName',
  'probabilityPostActionFieldName',
  'consequencePostActionFieldName'
]

/**
 * How long, in milliseconds, the property pane must be still after a change to a data property
 * before the items are fetched again: a text field reports every keystroke.
 */
const RELOAD_DELAY = 1000

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
   * Whether `auto` mode uses the data source on this site, that is whether it is a parent project
   * or program with the hub available; `undefined` until it has been looked up.
   */
  private _autoUsesDataSource: boolean

  /** The pending fetch after a change in the property pane. */
  private _reloadTimer: number

  /** Counts the fetches of items, so that only the latest one is applied. */
  private _loadCount = 0

  /**
   * Configuration for the concrete web part (content type, configuration folder,
   * default configuration setting key and default data source).
   */
  protected abstract get config(): IUncertaintyMatrixWebPartConfig

  public async onInit() {
    await super.onInit()
    const [configurations] = await Promise.all([
      SPDataAdapter.getConfigurations(this.config.configurationFolder),
      this._loadItems()
    ])
    const defaultConfigurationName = SPDataAdapter.globalSettings?.get(
      this.config.defaultConfigurationSettingKey
    )
    this._data.configurations = configurations
    this._data.defaultConfiguration = _.find(
      configurations,
      (config) => config.name === defaultConfigurationName
    )
  }

  /**
   * Renders the specified matrix component with the retrieved items, or the error
   * if retrieving them failed.
   *
   * @param component Matrix component to render
   */
  protected renderMatrix<P>(component: FC<P>): void {
    if (this._error) {
      // SPFx draws the error in place of the element's content, so the matrix is unmounted first
      // and a later render starts it afresh.
      unmountReact(this.domElement)
      this.renderError(this._error)
      return
    }
    this.clearError()
    this.renderComponent<P>(component, {
      items: this._data.items,
      // An emptied template is no template: the component's default applies, as when never set.
      calloutTemplate: this.properties.calloutTemplate || undefined,
      manualConfigurationPath:
        this.properties.manualConfigurationPath ?? this._data.defaultConfiguration?.url
    } as unknown as Partial<P>)
  }

  /**
   * Props for the matrix component: the base web part's, with the title falling back to the web
   * part's own title when the title field is emptied, as its placeholder shows.
   *
   * @param props Props to override the web part properties with
   */
  protected createPropsForComponent<P>(props: Partial<P>): P {
    return {
      ...super.createPropsForComponent<P>(props),
      title: this.properties.title || this.title
    }
  }

  /**
   * Fetches the items again once a property that decides them has changed in the property pane,
   * when the pane has been still for `RELOAD_DELAY`. SPFx renders the web part right after this
   * call, with the items it has; the fetch renders it again with the new ones.
   *
   * @param propertyPath Path of the changed property
   */
  protected onPropertyPaneFieldChanged(propertyPath: string): void {
    if (!DATA_PROPERTIES.includes(propertyPath)) return
    window.clearTimeout(this._reloadTimer)
    this._reloadTimer = window.setTimeout(() => {
      void this._reloadItems()
    }, RELOAD_DELAY)
  }

  protected onDispose(): void {
    window.clearTimeout(this._reloadTimer)
    // A fetch still under way is not applied to the disposed web part.
    this._loadCount++
    super.onDispose()
  }

  /**
   * Fetches the items again and renders the matrix with them (or the error), refreshing the
   * property pane, whose fields follow where the items come from.
   */
  private async _reloadItems(): Promise<void> {
    if (!(await this._loadItems())) return
    this.render()
    if (this.context.propertyPane.isPropertyPaneOpen()) this.context.propertyPane.refresh()
  }

  /**
   * Fetches the items into `_data.items`, or the error into `_error`. Resolves `false` when a
   * later fetch has started meanwhile: the result is then dropped.
   */
  private async _loadItems(): Promise<boolean> {
    const load = ++this._loadCount
    try {
      const items = await this._getItems()
      if (load !== this._loadCount) return false
      this._data.items = items
      this._error = undefined
    } catch (error) {
      if (load !== this._loadCount) return false
      this._error = error
    }
    return true
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
    // A field name that is empty or not on the item reads as '', so the model falls back to the
    // standard field.
    return items.map(
      (i) =>
        new UncertaintyElementModel(
          i,
          get(i, probabilityFieldName, ''),
          get(i, consequenceFieldName, ''),
          get(i, probabilityPostActionFieldName, ''),
          get(i, consequencePostActionFieldName, '')
        )
    )
  }

  /**
   * Whether the items come from the data source (`true`) or the local list (`false`) with the
   * current `dataFetchMode` (default `auto`); in `auto` mode `undefined` until the site has been
   * looked up.
   */
  private _usesDataSource(): boolean {
    switch (this.properties.dataFetchMode ?? 'auto') {
      case 'dataSource':
        return true
      case 'list':
        return false
      default:
        return this._autoUsesDataSource
    }
  }

  /**
   * Resolves whether to fetch items using the data source, looking up in `auto` mode whether the
   * site is a parent project or program with the hub available.
   */
  private async _shouldUseDataSource(): Promise<boolean> {
    const usesDataSource = this._usesDataSource()
    if (usesDataSource !== undefined) return usesDataSource
    this._autoUsesDataSource = !!(
      SPDataAdapter.portalDataService?.isAvailable && (await SPDataAdapter.isParentProject())
    )
    return this._autoUsesDataSource
  }

  /**
   * The CAML query for the items of the web part's content type, used when the web part has none.
   */
  private get _defaultViewXml(): string {
    return `<View><Query><Where><Eq><FieldRef Name="ContentType" /><Value Type="Computed">${this.config.contentTypeName}</Value></Eq></Where></Query></View>`
  }

  /**
   * Get items from the local list named in the web part (`listName`, default the uncertainty
   * list) using its CAML query (`viewXml`, default the items of the web part's content type).
   */
  private async _getItemsFromList(): Promise<Record<string, any>[]> {
    return await this.sp.web.lists
      .getByTitle(this.properties.listName?.trim() || resource.Lists_Uncertainty_Title)
      .getItemsByCAMLQuery({ ViewXml: this.properties.viewXml?.trim() || this._defaultViewXml })
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

  /**
   * The property pane. The data group offers the fields of where the items come from: the data
   * source on a parent project or program, the local list otherwise (both in `auto` mode until
   * the site has been looked up).
   */
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const dataFetchMode = this.properties.dataFetchMode ?? 'auto'
    const usesDataSource = this._usesDataSource()
    const fullWidth = this.properties.fullWidth ?? true
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
                usesDataSource !== false &&
                  PropertyPaneTextField('dataSource', {
                    label: strings.DataSourceLabel,
                    description: strings.DataSourceDescription,
                    placeholder: this.config.defaultDataSourceName
                  }),
                usesDataSource !== false &&
                  PropertyPaneToggle('filterByShowInPortfolio', {
                    label: strings.FilterByShowInPortfolioLabel,
                    checked: this.properties.filterByShowInPortfolio ?? true
                  }),
                usesDataSource !== true &&
                  PropertyPaneTextField('listName', {
                    label: strings.ListNameFieldLabel,
                    placeholder: resource.Lists_Uncertainty_Title
                  }),
                usesDataSource !== true &&
                  PropertyPaneTextField('viewXml', {
                    label: strings.ViewXmlFieldLabel,
                    multiline: true,
                    placeholder: this._defaultViewXml
                  }),
                PropertyPaneTextField('probabilityFieldName', {
                  label: strings.ProbabilityFieldNameFieldLabel,
                  placeholder: 'GtRiskProbability'
                }),
                PropertyPaneTextField('consequenceFieldName', {
                  label: strings.ConsequenceFieldNameFieldLabel,
                  placeholder: 'GtRiskConsequence'
                }),
                PropertyPaneTextField('probabilityPostActionFieldName', {
                  label: strings.ProbabilityPostActionFieldNameFieldLabel,
                  placeholder: 'GtRiskProbabilityPostAction'
                }),
                PropertyPaneTextField('consequencePostActionFieldName', {
                  label: strings.ConsequencePostActionFieldNameFieldLabel,
                  placeholder: 'GtRiskConsequencePostAction'
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
                  checked: fullWidth
                }),
                !fullWidth &&
                  PropertyPaneSlider('width', {
                    label: strings.WidthFieldLabel,
                    min: 400,
                    max: 1000,
                    value: DEFAULT_MATRIX_WIDTH,
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
