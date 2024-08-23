import { flatten, get } from '@microsoft/sp-lodash-subset'
import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'ProjectWebPartsStrings'
import { IRiskMatrixProps } from 'components/RiskMatrix'
import { RiskMatrix } from 'components/RiskMatrix'
import _ from 'lodash'
import ReactDom from 'react-dom'
import SPDataAdapter from '../../data'
import { UncertaintyElementModel } from '../../models'
import { BaseProjectWebPart } from '../baseProjectWebPart'
import { IRiskMatrixWebPartData, IRiskMatrixWebPartProps } from './types'
import { IItem, IList } from '@pnp/sp/presets/all'
import { DataSourceService, PortalDataService } from 'pp365-shared-library'
import { format } from '@fluentui/react'

export default class RiskMatrixWebPart extends BaseProjectWebPart<IRiskMatrixWebPartProps> {
  private _data: IRiskMatrixWebPartData = {}
  private _error: Error
  public portalDataService: PortalDataService
  public dataSourceService: DataSourceService
  public childProjects: Array<Record<string, string>>
  private _propertyList: IList
  private _propertyItem: IItem

  public async onInit() {
    await super.onInit()
    try {
      this.portalDataService = await new PortalDataService().configure({
        spfxContext: this.context
      })

      this._propertyList = this.sp.web.lists.getByTitle('Prosjektegenskaper')
      await this.initChildProjects()

      const [items, configurations] = await Promise.all([
        this._getItems(),
        SPDataAdapter.getConfigurations(strings.RiskMatrixConfigurationFolder)
      ])
      const defaultConfiguration = _.find(
        configurations,
        (config) =>
          config.name === SPDataAdapter.globalSettings.get('RiskMatrixDefaultConfigurationFile')
      )
      this._data = { items, configurations, defaultConfiguration }
    } catch (error) {
      this._error = error
    }
  }

  public render(): void {
    if (this._error) {
      this.renderError(this._error)
    } else {
      const { items, defaultConfiguration } = this._data
      this.renderComponent<IRiskMatrixProps>(RiskMatrix, {
        ...this.properties,
        width: this.properties.fullWidth ? '100%' : this.properties.width,
        items: items,
        manualConfigurationPath:
          this.properties.manualConfigurationPath ?? defaultConfiguration?.url
      })
    }
  }

  /**
   * Get items from list `this.properties.listName` using CAML query
   */
  protected async _getItems(): Promise<UncertaintyElementModel[]> {
    const {
      probabilityFieldName,
      consequenceFieldName,
      probabilityPostActionFieldName,
      consequencePostActionFieldName,
      viewXml,
      listName,
      useDataSource,
      dataSource
    } = this.properties

    let items: any[] = []

    if (useDataSource) {
      this.dataSourceService = new DataSourceService(this.portalDataService.web)
      items = await this._getItemsWithSource(dataSource, ['GtRiskStrategyOWSCHCS', 'GtRiskProximityOWSCHCS', 'GtRiskStatusOWSCHCS'], true)
    } else {
      items = await this.sp.web.lists.getByTitle(listName).getItemsByCAMLQuery({ ViewXml: viewXml })
    }

    return items.map(
      (i, idx) =>
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
   * Fetch items using the specified `queryTemplate` and `selectProperties`
   *
   * @param queryTemplate Query template
   * @param selectProperties Select properties
   */
  private async _fetchItems(
    queryTemplate: string,
    selectProperties: string[],
    includeSelf: boolean = false,
    siteIdManagedProperty: string = 'SiteId'
  ) {
    const siteId = this.context.pageContext.site.id.toString()
    const queries = this.childProjects && this.aggregatedQueryBuilder(siteIdManagedProperty)
    if (includeSelf) queries.unshift(`${siteIdManagedProperty}:${siteId}`)
    const promises = queries.map((q) =>
      this.sp.search({
        QueryTemplate: `${q} ${queryTemplate}`,
        Querytext: '*',
        RowLimit: 500,
        TrimDuplicates: false,
        SelectProperties: [
          ...selectProperties,
          'ListItemID',
          'Path',
          'Title',
          'SiteTitle',
          'SPWebURL'
        ]
      })
    )
    const responses = await Promise.all(promises)
    return flatten(responses.map((r) => r.PrimarySearchResults))
  }

  /**
   * Fetches child projects from the Prosjektegenskaper list item. The note field `GtChildProjects`
   * contains a JSON string with the child projects, and needs to be parsed. If the retrieve
   * fails, an empty array is returned.
   *
   * @returns An array of child projects, each represented as a record with `SiteId` and `Title` properties.
   */
  public async getChildProjects(): Promise<Array<Record<string, string>>> {
    try {
      const projectProperties = await this._propertyItem.select('GtChildProjects')()
      try {
        const childProjects = JSON.parse(projectProperties.GtChildProjects)
        return !_.isEmpty(childProjects) ? childProjects : []
      } catch {
        return []
      }
    } catch {
      return []
    }
  }

  /**
   * Initialize child projects. Runs `getChildProjects` and sets the `childProjects` property
   * of the class.
   */
  public async initChildProjects(): Promise<void> {
    try {
      this._propertyItem = this._propertyList.items.getById(1)
      this.childProjects = await this.getChildProjects()
    } catch (error) {}
  }

  /**
   * Create queries if number of projects exceeds threshold to avoid 4096 character limitation by SharePoint
   *
   * @param queryProperty Dependant on whether it is aggregated portfolio or portfolio overview
   * @param maxQueryLength Maximum length of query before pushing to array (default: 2500)
   * @param maxProjects Maximum projects required before creating strings  (default: 25)
   */
  public aggregatedQueryBuilder(
    queryProperty: string,
    maxQueryLength: number = 2500,
    maxProjects: number = 25
  ): string[] {
    const aggregatedQueries = []
    let queryString = ''
    if (this.childProjects.length > maxProjects) {
      this.childProjects.forEach((childProject, index) => {
        queryString += `${queryProperty}:${childProject.SiteId} `
        if (queryString.length > maxQueryLength) {
          aggregatedQueries.push(queryString)
          queryString = ''
        }
        if (index === this.childProjects.length - 1) {
          aggregatedQueries.push(queryString)
        }
      })
    } else {
      this.childProjects.forEach((childProject) => {
        queryString += `${queryProperty}:${childProject.SiteId} `
      })
      aggregatedQueries.push(queryString)
    }
    return aggregatedQueries.filter(Boolean)
  }

  /**
   * Fetch items with data source name. If the data source is a benefit overview,
   * the items are fetched using `fetchBenefitItemsWithSource`.
   *
   * The properties 'FileExtension' and 'ServerRedirectedURL' is always added to the select properties.
   *
   * @param dataSourceName Data source name
   */
  public async _getItemsWithSource(
    dataSourceName: string,
    selectProperties: string[],
    includeSelf: boolean = false
  ): Promise<any[]> {
    let items: any[]
    const dataSrc = await this.dataSourceService.getByName(dataSourceName)
    if (!dataSrc) {
      throw new Error(format(strings.DataSourceNotFound, dataSourceName))
    }
    try {
      const dataSrcProperties = dataSrc.columns.map((col) => col.fieldName) || []

      items = await this._fetchItems(
        dataSrc.searchQuery,
        [...selectProperties, ...dataSrcProperties],
        includeSelf
      )
      return items
    } catch (error) {
      throw new Error(`${format(strings.DataSourceError, dataSourceName)}  ${error}`)
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement)
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.DataGroupName,
              groupFields: [
                PropertyPaneToggle('useDataSource', {
                  label: 'Use data source'
                }),
                PropertyPaneTextField('dataSource', {
                  label: 'Data source name'
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
              ]
            },
            {
              groupName: strings.LookAndFeelGroupName,
              groupFields: [
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
                  options: this._data.configurations.map(({ url: key, title: text }) => ({
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
