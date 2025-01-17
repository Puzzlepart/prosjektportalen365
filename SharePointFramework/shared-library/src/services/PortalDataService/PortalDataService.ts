import { format } from '@fluentui/react'
import { find } from '@microsoft/sp-lodash-subset'
import { AssignFrom, dateAdd, PnPClientStorage, stringIsNullOrEmpty } from '@pnp/core'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import { IFolder } from '@pnp/sp/folders'
import { ICamlQuery, IList } from '@pnp/sp/lists'
import '@pnp/sp/presets/all'
import { IItemUpdateResult, IItemUpdateResultData, spfi, SPFI } from '@pnp/sp/presets/all'
import { PermissionKind } from '@pnp/sp/security'
import { IWeb } from '@pnp/sp/webs'
import { merge } from 'lodash'
import strings from 'SharedLibraryStrings'
import initJsom, { ExecuteJsomQuery as executeQuery } from 'spfx-jsom'
import _ from 'underscore'
import { createSpfiInstance, DefaultCaching, getItemFieldValues } from '../../data'
import { ISPContentType } from '../../interfaces'
import {
  DataSource,
  IProjectTemplateSPItem,
  ItemFieldValues,
  PortfolioOverviewView,
  ProjectAdminRole,
  ProjectColumn,
  ProjectColumnConfig,
  ProjectContentColumn,
  ProjectTemplate,
  SectionModel,
  SPDataSourceItem,
  SPField,
  SPPortfolioOverviewViewItem,
  SPProjectAdminRoleItem,
  SPProjectColumnConfigItem,
  SPProjectColumnItem,
  SPProjectContentColumnItem,
  StatusReport,
  StatusReportAttachment
} from '../../models'
import { getClassProperties, makeUrlAbsolute, transformFieldXml } from '../../util'
import { DataService } from '../DataService'
import {
  GetStatusReportsOptions,
  IPortalDataServiceConfiguration,
  IProjectDetails,
  ISyncListReturnType,
  NoAccessToPortfolioError,
  PortalDataServiceDefaultConfiguration,
  PortalDataServiceList,
  SyncListParams
} from './types'

export class PortalDataService extends DataService<IPortalDataServiceConfiguration> {
  private _sp: SPFI
  private _spPortal: SPFI
  public web: IWeb
  public url: string
  public hubSiteId: string

  /**
   * Configure PortalDataService
   *
   * @param configuration Configuration for PortalDataService
   */
  public async configure(
    configuration: IPortalDataServiceConfiguration
  ): Promise<PortalDataService> {
    Logger.subscribe(ConsoleListener())
    Logger.activeLogLevel = configuration.activeLogLevel
    Logger.log({
      message: '(PortalDataService) (configure) Configuring PortalDataService',
      level: LogLevel.Info,
      data: _.pick(configuration, 'listNames', 'url')
    })
    super.onConfigureStart(merge({ ...PortalDataServiceDefaultConfiguration }, configuration))
    this._sp = createSpfiInstance(this._configuration.spfxContext)
    await this.onInit(configuration?.url)
    return super.onConfigured()
  }

  /**
   * Initialize the `PortalDataService` instance. If the `url` parameter is
   * set, the instance will be initialized with the specified URL. If the
   * `url` parameter is not set, the instance will be initialized with the
   * URL from the hub site ID in the SPFx context.
   *
   * @param url URL (optional)
   * @param expire Expire date for the hub site ID (optional with default of 1 year)
   */
  private async onInit(url?: string, expire: Date = dateAdd(new Date(), 'year', 1)): Promise<void> {
    Logger.write(`(PortalDataService) (onInit) Initializing PortalDataService instance with URL ${url}`, LogLevel.Info)
    if (url) {
      this.url = url
      this._spPortal = spfi(this.url).using(AssignFrom(this._sp.web))
      this.web = this._spPortal.web
      this.hubSiteId = await new PnPClientStorage().local.getOrPut(
        `hubsite_${this.url.replace(/-/g, '')}_id`,
        async () => {
          const { PrimarySearchResults } = await this._sp.search({
            Querytext: `Path=${this.url} contentclass:STS_Site`,
            SelectProperties: ['SiteId', 'Path']
          })
          if (PrimarySearchResults.length === 0) {
            throw NoAccessToPortfolioError(this.url)
          }
          return PrimarySearchResults[0].SiteId
        },
        expire
      )
      return
    }
    try {
      this.hubSiteId =
        this._configuration.spfxContext.pageContext.legacyPageContext.hubSiteId || ''
      console.log('onInit', this.hubSiteId)
      try {
        const hubSite = await (
          await fetch(
            `${this._configuration.spfxContext.pageContext.web.absoluteUrl}/_api/HubSites/GetById('${this.hubSiteId}')`,
            {
              method: 'GET',
              headers: {
                Accept: 'application/json;odata=nometadata'
              },
              credentials: 'include'
            }
          )
        ).json()
        this.url = hubSite.SiteUrl
      } catch (error) {
        this.url = await new PnPClientStorage().local.getOrPut(
          `hubsite_${this.hubSiteId.replace(/-/g, '')}_url`,
          async () => {
            const { PrimarySearchResults } = await this._sp.search({
              Querytext: `SiteId:${this.hubSiteId} contentclass:STS_Site`,
              SelectProperties: ['Path']
            })
            return PrimarySearchResults[0] ? PrimarySearchResults[0].Path : ''
          },
          expire
        )
      }
    } catch (err) {
      throw err
    }
    this._spPortal = spfi(this.url).using(AssignFrom(this._sp.web))
    this.web = this._spPortal.web
  }

  /**
   * Get parent projects from the projects list in the portfolio site.
   *
   * @note Your model class specified in the constructor param should include a
   * property `childProjects` (array of strings which is the web/project URLs).
   *
   * @param webUrl Web URL
   * @param constructor Constructor / model class
   */
  public async getParentProjects<T>(
    webUrl: string,
    constructor: new (item: any, web: IWeb) => T
  ): Promise<T[]> {
    try {
      const projectItems = await this.getItems(
        this._configuration.listNames.PROJECTS,
        constructor,
        {
          ViewXml: `<View>
  <Query>
    <OrderBy>
      <FieldRef Name="ID" />
    </OrderBy>
    <Where>
      <Contains>
        <FieldRef Name="GtChildProjects" />
        <Value Type="Note">${webUrl}</Value>
      </Contains>
    </Where>
  </Query>
</View>`
        },
        []
      )
      return projectItems.filter((p) =>
        p['childProjects'] ? p['childProjects'].includes(webUrl) : true
      )
    } catch (error) {
      return []
    }
  }

  /**
   * Get programs from the projects list in the portfolio site.
   *
   * @param constructor Constructor / model class
   */
  public async getPrograms<T>(constructor: new (item: any, web: IWeb) => T): Promise<T[]> {
    try {
      const items = await this.getItems(
        this._configuration.listNames.PROJECTS,
        constructor,
        {
          ViewXml: `<View>
  <Query>
    <OrderBy>
      <FieldRef Name="Title" />
    </OrderBy>
    <Where>
      <Eq>
        <FieldRef Name="GtIsProgram" />
        <Value Type="Boolean">1</Value>
      </Eq>
  </Where>
  </Query>
</View>`
        },
        []
      )
      return items
    } catch (error) {
      return []
    }
  }

  /**
   * Get project columns from the project columns list in the portfolio site.
   * Optionally override the list name with the `listName` parameter.
   * 
   * @param listName Optional list name for overriding the default list name
   */
  public async getProjectColumns(listName?: string): Promise<ProjectColumn[]> {
    try {
      const spItems = await this._getList('PROJECT_COLUMNS', listName).items.select(
        ...getClassProperties(SPProjectColumnItem)
      )<SPProjectColumnItem[]>()
      return spItems.map((item) => new ProjectColumn(item))
    } catch (error) {
      return []
    }
  }

  /**
   * Get project status sections using `DefaultCaching`.
   */
  public async getProjectStatusSections(): Promise<SectionModel[]> {
    try {
      const items = await this._getList('STATUS_SECTIONS').items.using(DefaultCaching)()
      return items.map((item) => new SectionModel(item))
    } catch (error) {
      return []
    }
  }

  /**
   * Ensures a folder in the attachments library for the status report.
   *
   * @param report Status report
   */
  private async ensureAttachmentsFolder(report: StatusReport): Promise<IFolder> {
    const folderName = report.id.toString()
    const list = this._getList('PROJECT_STATUS_ATTACHMENTS')
    try {
      await list.rootFolder.folders.getByUrl(folderName)()
      return list.rootFolder.folders.getByUrl(folderName)
    } catch (error) {
      const { folder } = await list.rootFolder.folders.addUsingPath(folderName)
      return folder
    }
  }

  /**
   * Publish status report. Sets `GtModerationStatus` to `publishedString` and
   * `GtLastReportDate` to `reportDate`. Then uploads the persisted section data
   * and snapshot to the attachments folder (in a separate hidden library).
   *
   * @param report Status report
   * @param reportDate Status report date
   * @param snapshotContent Snapshot content
   * @param attachments Attachments to upload in the attachments folder (in a separate hidden library)
   * @param publishedString String value for published state
   */
  public async publishStatusReport(
    report: StatusReport,
    reportDate: string,
    attachments: StatusReportAttachment[],
    publishedString?: string
  ): Promise<StatusReport> {
    const projectStatusList = this._getList('PROJECT_STATUS')
    try {
      const attachmentsFolder = await this.ensureAttachmentsFolder(report)
      const [, ...attachmentResults] = await Promise.all([
        projectStatusList.items.getById(report.id).update({
          GtModerationStatus: publishedString,
          GtLastReportDate: new Date()
        }),
        ...attachments.map(({ url, content }) =>
          attachmentsFolder.files.addUsingPath(url, content, {
            Overwrite: true
          })
        )
      ])
      attachments = attachmentResults.map(({ data }) => ({
        name: data.Name,
        url: data.ServerRelativeUrl
      }))
      return report.initAttachments(attachments).setValues({
        GtModerationStatus: publishedString,
        GtLastReportDate: reportDate
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Publish status report. Sets `GtModerationStatus` to `publishedString` and
   * `GtLastReportDate` to `reportDate`. Then uploads the persisted section data
   * and snapshot to the attachments folder (in a separate hidden library).
   *
   * @param report Status report
   * @param properties Properties to update
   */
  public async updateStatusReport(
    report: StatusReport,
    properties: Record<string, any>
  ): Promise<StatusReport> {
    const projectStatusList = this._getList('PROJECT_STATUS')
    try {
      await projectStatusList.items.getById(report.id).update(properties)
      return report.setValues(properties)
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete status report by ID
   *
   * @param id Id
   */
  public async deleteStatusReport(id: number): Promise<void> {
    await this._getList('PROJECT_STATUS').items.getById(id).delete()
  }

  /**
   * Get project column configuration using `DefaultCaching`. 
   * 
   * @param listName Optional list name for overriding the default list name
   */
  public async getProjectColumnConfig(listName?: string): Promise<ProjectColumnConfig[]> {
    const spItems = await this._getList('PROJECT_COLUMN_CONFIGURATION', listName)
      .items.orderBy('ID', true)
      .expand('GtPortfolioColumn', 'GtPortfolioColumnTooltip')
      .select(
        ...getClassProperties(SPProjectColumnConfigItem),
        'GtPortfolioColumn/Title',
        'GtPortfolioColumn/GtInternalName',
        'GtPortfolioColumnTooltip/GtManagedProperty'
      )
      .using(DefaultCaching)<SPProjectColumnConfigItem[]>()
    return spItems.map((item) => new ProjectColumnConfig(item))
  }

  /**
   * Adds a new column to the project columns list and adds the column to the specified view.
   *
   * @param properties Properties for the new column (`Id` will be omitted)
   * @param view The view to add the column to
   */
  public async addColumnToPortfolioView(
    properties: SPProjectColumnItem,
    view: PortfolioOverviewView
  ): Promise<boolean> {
    try {
      const projectColumnsList = this._getList('PROJECT_COLUMNS')
      const portfolioViewsList = this._getList('PORTFOLIO_VIEWS')
      const column = await projectColumnsList.items.add(_.omit(properties, ['Id']))
      portfolioViewsList.items.getById(view.id as any).update({
        GtPortfolioColumnsId: [...view.columns.map((c) => c.id), column.data.Id]
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get portfolio overview views. Returns all shared views and personal views.
   */
  public async getPortfolioOverviewViews(): Promise<PortfolioOverviewView[]> {
    const email = this._configuration.spfxContext.pageContext.user.email
    const filter = `GtPortfolioIsPersonalView eq 0 or (GtPortfolioIsPersonalView eq 1 and Author/EMail eq '${email}')`
    const spItems = await this._getList('PORTFOLIO_VIEWS')
      .items.select(...getClassProperties(SPPortfolioOverviewViewItem), 'Author/EMail')
      .expand('Author')
      .filter(filter)
      .orderBy('GtSortOrder', true)<SPPortfolioOverviewViewItem[]>()
    return spItems.map((item) => new PortfolioOverviewView(item))
  }

  /**
   * Get list form urls
   *
   * @param list List key
   * @param listName Optional list name for overriding the default list name
   */
  public async getListFormUrls(
    list: PortalDataServiceList,
    listName?: string
  ): Promise<{ defaultNewFormUrl: string; defaultEditFormUrl: string }> {
    const urls = await this._getList(list, listName)
      .select('DefaultNewFormUrl', 'DefaultEditFormUrl')
      .expand('DefaultNewFormUrl', 'DefaultEditFormUrl')<{
        DefaultNewFormUrl: string
        DefaultEditFormUrl: string
      }>()
    return {
      defaultNewFormUrl: makeUrlAbsolute(urls.DefaultNewFormUrl),
      defaultEditFormUrl: makeUrlAbsolute(urls.DefaultEditFormUrl)
    }
  }

  /**
   * Checks if the current user has the specified permissions to the
   * specified list.
   *
   * @param list List key
   * @param permissionKind Permission kind to check
   * @param listName Optional list name for overriding the default list name
   */
  public async currentUserHasPermissionsToList(
    list: PortalDataServiceList,
    permissionKind: PermissionKind,
    listName?: string
  ): Promise<boolean> {
    return await this._getList(list, listName).currentUserHasPermissions(permissionKind)
  }

  /**
   * Sync list with project properties from hub site.
   *
   * Skips fields that has `ShowInEditForm` set to `FALSE`
   *
   * @param params Sync list parameters
   */
  public async syncList(params: SyncListParams): Promise<ISyncListReturnType> {
    const fieldsAdded: SPField[] = []
    const web = spfi(params.url).using(AssignFrom(this._sp.web)).web
    const { jsomContext } = await initJsom(params.url, { loadTaxonomy: true })
    const [hubContentType, targetSiteFields, ensureList] = await Promise.all([
      this._getContentType(params.contentTypeId),
      this._getSiteFields(web),
      web.lists.ensure(params.listName, '', 100, false, {
        Hidden: true,
        EnableAttachments: false,
        EnableVersioning: true
      })
    ])
    const listFields = await this.getListFields(params.listName, undefined, web)
    const spList = jsomContext.web.get_lists().getByTitle(params.listName)
    for (const field of hubContentType.Fields) {
      const [[listField], [siteField]] = [
        listFields.filter((fld) => fld.InternalName === field.InternalName),
        targetSiteFields.filter(
          (fld) =>
            fld.InternalName === field.InternalName &&
            fld.SchemaXml.indexOf('ShowInEditForm="FALSE"') === -1
        )
      ]
      if (listField) {
        Logger.log({
          message: `(PortalDataService) (syncList) Field [${field.InternalName}] already exists on list [${params.listName}].`,
          level: LogLevel.Info
        })
        continue
      }
      try {
        const [fieldLink] = hubContentType.FieldLinks.filter((fl) => fl.Name === field.InternalName)
        Logger.log({
          message: `(PortalDataService) (syncList) Adding field [${field.InternalName}] to list [${params.listName}].`,
          level: LogLevel.Info
        })
        if (params.progressFunc) {
          params.progressFunc(format(strings.SyncListAddingField, field.Title))
        }
        if (siteField) {
          const fldToAdd = jsomContext.web
            .get_fields()
            .getByInternalNameOrTitle(siteField.InternalName)
          const newField = spList.get_fields().add(fldToAdd)
          if (fieldLink && fieldLink.Required) {
            newField.set_required(true)
            newField.updateAndPushChanges(true)
          }
          fieldsAdded.push(siteField)
        } else {
          const fieldToCreate = spList
            .get_fields()
            .addFieldAsXml(
              transformFieldXml(field.SchemaXml, { DisplayName: field.InternalName }),
              false,
              SP.AddFieldOptions.addToDefaultContentType
            )
          if (fieldLink && fieldLink.Required) {
            fieldToCreate.set_required(true)
          }
          fieldToCreate.set_title(field.Title)
          fieldToCreate.updateAndPushChanges(true)
          fieldsAdded.push(field)
        }
        await executeQuery(jsomContext)
      } catch (error) { }
    }
    try {
      const templateParametersField = spList
        .get_fields()
        .addFieldAsXml(
          this._configuration.templateParametersFieldXml,
          false,
          SP.AddFieldOptions.addToDefaultContentType
        )
      templateParametersField.updateAndPushChanges(true)
      await executeQuery(jsomContext)
    } catch { }
    if (ensureList.created && params.properties) {
      ensureList.list.items.add(params.properties)
    }
    return { ...ensureList, fieldsAdded }
  }

  /**
   * Get content type by ID from the portal site. Expands `Fields` and `FieldLinks`.
   *
   * @param contentTypeId Content type ID
   */
  private async _getContentType(contentTypeId: string): Promise<ISPContentType> {
    const contentType = await this.web.contentTypes
      .getById(contentTypeId)
      .select(
        'StringId',
        'Name',
        'Fields/InternalName',
        'Fields/Title',
        'Fields/SchemaXml',
        'Fields/InternalName',
        'FieldLinks/Name',
        'FieldLinks/Required'
      )
      .expand('Fields', 'FieldLinks')<ISPContentType>()
    return contentType
  }

  /**
   * Get site fields
   *
   * @param web Web (default: `this.web`)
   */
  private async _getSiteFields(web = this.web): Promise<SPField[]> {
    const siteFields = await web.fields.select(...getClassProperties(SPField))<SPField[]>()
    return siteFields
  }

  /**
   * Get files using `DefaultCaching` and maps them to the specified constructor.
   *
   * @param listName List name
   * @param constructor Constructor
   */
  public async getFiles<T>(
    listName: string,
    constructor: new (file: any, web: IWeb) => T
  ): Promise<T[]> {
    const files = await this.web.lists.getByTitle(listName).rootFolder.files.using(DefaultCaching)()
    return files.map((file) => new constructor(file, this._spPortal.web))
  }

  /**
   * Get items and maps them to the specified constructor.
   *
   * @param listName List name
   * @param constructor Constructor function
   * @param query Caml query if `getItemsByCAMLQuery` should be used
   * @param expands Expands for `getItemsByCAMLQuery`
   */
  public async getItems<T>(
    listName: string,
    constructor: new (item: any, web: IWeb, sp?: SPFI) => T,
    query?: ICamlQuery,
    expands?: string[]
  ): Promise<T[]> {
    try {
      if (stringIsNullOrEmpty(listName)) return []
      const list = this.web.lists.getByTitle(listName)
      let items: any[]
      if (query) items = await list.getItemsByCAMLQuery(query, ...(expands ?? []))
      else items = await list.items.using(DefaultCaching)()
      return items.map((item) => new constructor(item, this.web, this._sp))
    } catch (error) {
      throw new Error(`Error getting items from list ${listName}: ${error.message}`)
    }
  }

  /**
   * Add status report with the specified `properties` and `contentTypeId`. A new
   * `StatusReport` instance is returned.
   *
   * @param properties Properties to add for the new item
   * @param contentTypeId Content type ID
   */
  public async addStatusReport(
    properties: Record<string, any>,
    contentTypeId: string
  ): Promise<StatusReport> {
    const list = this._getList('PROJECT_STATUS')
    if (contentTypeId) {
      const contentTypes = await list.contentTypes()
      const ct = find(contentTypes, (ct) => ct.StringId.indexOf(contentTypeId) === 0)
      if (ct) properties.ContentTypeId = ct.StringId
    }
    const itemData = await this.addItemToList<Record<string, any>>('PROJECT_STATUS', properties)
    return new StatusReport(new ItemFieldValues(itemData))
  }

  /**
   * Update project content column with new values for properties `GtColMinWidth` and `GtColMaxWidth`,
   * as well as the `GtFieldDataType` property if parameter `persistRenderAs` is true.
   *
   * @param _list List
   * @param column Project content column
   * @param persistRenderAs Persist render as property
   */
  public async updateProjectContentColumn(
    _list: PortalDataServiceList,
    columnItem: SPProjectContentColumnItem,
    persistRenderAs = false
  ): Promise<IItemUpdateResult> {
    try {
      const list = this._getList(_list)
      const properties: SPProjectContentColumnItem = _.pick(
        columnItem,
        [
          'Title',
          'GtColMinWidth',
          'GtColMaxWidth',
          persistRenderAs && 'GtFieldDataTypeProperties',
          persistRenderAs && 'GtFieldDataType',
          'GtIsGroupable'
        ].filter(Boolean)
      )
      return await list.items.getById(columnItem.Id).update(properties)
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * Update the data source item with title `dataSourceTitle` with the properties in `properties`.
   *
   * @param _list List
   * @param properties Properties
   * @param dataSourceTitle Data source title
   * @param shouldReplace Should replace the existing columns
   */
  public async updateDataSourceItem(
    _list: PortalDataServiceList,
    properties: SPDataSourceItem,
    dataSourceTitle: string,
    shouldReplace: boolean = false
  ): Promise<IItemUpdateResult> {
    try {
      const list = this._getList(_list)
      const [item] = await list.items.filter(`Title eq '${dataSourceTitle}'`)()
      if (item.GtProjectContentColumnsId && !shouldReplace) {
        properties.GtProjectContentColumnsId = [
          ...item.GtProjectContentColumnsId,
          properties.GtProjectContentColumnsId
        ]
        return await list.items.getById(item.Id).update(properties)
      } else {
        properties.GtProjectContentColumnsId = properties.GtProjectContentColumnsId as number[]
        return await list.items.getById(item.Id).update(properties)
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * Fetch project content columns from the project content columns SharePoint list on the hub site
   * with the specified `dataSourceCategory` or without a category. The result is transformed into
   * `ProjectColumn` objects. The `renderAs` property is set to the `dataType` property in lower case
   * and with spaces replaced with underscores.
   *
   * If the `dataSourceCategory` is null or empty, an empty array is returned.
   *
   * @param _list List
   * @param category Category for data source
   * @param level Level for data source
   */
  public async fetchProjectContentColumns(
    _list: PortalDataServiceList,
    dataSourceCategory: string,
    level?: string
  ) {
    try {
      if (stringIsNullOrEmpty(dataSourceCategory)) return []
      const list = this._getList(_list)
      const columnItems = await list.items.select(
        ...Object.keys(new SPProjectContentColumnItem())
      )()
      const filteredColumnItems = columnItems.filter(
        (col) =>
          col.GtDataSourceCategory === dataSourceCategory ||
          col.GtDataSourceCategory === null ||
          (!col.GtDataSourceCategory && !col.GtDataSourceLevel) ||
          (!col.GtDataSourceCategory && _.contains(col.GtDataSourceLevel, level))
      )

      return filteredColumnItems.map((item) => new ProjectContentColumn(item))
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * Adds a new column to the project content columns list and adds the column to the specified data source.
   *
   * @param properties Properties for the new column (`Id` will be omitted)
   * @param dataSource The data source to add the column to
   */
  public async addColumnToDataSource(
    properties: SPProjectContentColumnItem,
    dataSource: DataSource
  ): Promise<boolean> {
    try {
      const projectContentColumnsList = this._getList('PROJECT_CONTENT_COLUMNS')
      const dataSourceList = this._getList('DATA_SOURCES')
      const column = await projectContentColumnsList.items.add(_.omit(properties, ['Id']))
      dataSourceList.items.getById(dataSource.id as any).update({
        GtProjectContentColumnsId: [...dataSource.columns.map((c) => c.id), column.data.Id]
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Add item to a list
   *
   * @param list List
   * @param properties Properties
   */
  public async addItemToList<T = any>(
    list: PortalDataServiceList,
    properties: Record<string, any>
  ): Promise<T> {
    try {
      const itemAddResult = await this._getList(list).items.add(properties)
      return itemAddResult.data as T
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * Update item in a list
   *
   * @param list List
   * @param itemId Item ID
   * @param properties Properties
   */
  public async updateItemInList<T = IItemUpdateResultData>(
    list: PortalDataServiceList,
    itemId: number,
    properties: Record<string, any>
  ): Promise<T> {
    try {
      const itemUpdateResult = await this._getList(list).items.getById(itemId).update(properties)
      return itemUpdateResult.data as unknown as T
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * Deletes the item with the specified ID from the specified list.
   *
   * @param list List
   * @param itemId Item ID
   */
  public async deleteItemFromList(list: PortalDataServiceList, itemId: number): Promise<boolean> {
    try {
      await this._getList(list).items.getById(itemId).delete()
      return true
    } catch {
      return false
    }
  }

  /**
   * Get status reports using caching by default. Can be turned off by setting
   * `useCaching` to `false`.
   *
   * @param options Options for getting status reports
   */
  public async getStatusReports({
    filter = '',
    top,
    select,
    useCaching = true
  }: GetStatusReportsOptions): Promise<StatusReport[]> {
    if (!this._configuration.spfxContext.pageContext)
      throw 'Property {pageContext} is not the configuration.'
    if (stringIsNullOrEmpty(filter))
      filter = `GtSiteId eq '${this._configuration.spfxContext.pageContext.site.id.toString()}'`
    try {
      const list = this._getList('PROJECT_STATUS')
      let items = list.items
        .filter(filter)
        .expand('FieldValuesAsText', 'AttachmentFiles')
        .orderBy('Id', false)
      if (top) items = items.top(top)
      if (select) items = items.select(...select)
      if (useCaching) items = items.using(DefaultCaching)
      const reportItems = await items()
      const reports = reportItems.map((i) => {
        const itemFieldValues = ItemFieldValues.create({
          fieldValues: i,
          fieldValuesAsText: i.FieldValuesAsText
        })
        return new StatusReport(itemFieldValues)
      })
      return reports
    } catch (error) {
      throw error
    }
  }

  /**
   * Get attachments for the specified status report. If the attachment filename
   * contains `.txt` or `.json` the content will be fetched and added to the
   * attachment object.
   *
   * @param report Status report
   */
  public async getStatusReportAttachments(report: StatusReport): Promise<StatusReport> {
    const attachmentsFolder = await this.ensureAttachmentsFolder(report)
    const attachmentFiles = await attachmentsFolder.files.using(DefaultCaching)()
    const attachmentFilesContent = await Promise.all(
      attachmentFiles.map(async ({ Name: name, ServerRelativeUrl: url }) => {
        const attachment: StatusReportAttachment = {
          name,
          url
        }
        if (url.indexOf('.txt') !== -1 || url.indexOf('.json') !== -1) {
          attachment.content = await this.web.getFileByServerRelativePath(url).getText()
        }
        return attachment
      })
    )
    return report.initAttachments(attachmentFilesContent)
  }

  /**
   * Get status report list props
   *
   * TODO: Use caching with @pnp/sp v3
   */
  public getStatusReportListProps(): Promise<{ DefaultEditFormUrl: string }> {
    try {
      return this._getList('PROJECT_STATUS')
        .select('DefaultEditFormUrl')
        .expand('DefaultEditFormUrl')<{ DefaultEditFormUrl: string }>()
    } catch (error) {
      throw error
    }
  }

  /**
   * Get list fields
   *
   * @param list List
   * @param filter Filter
   * @param web Web (default: `this.web`)
   */
  public async getListFields(
    list: PortalDataServiceList | string,
    filter?: string,
    web: IWeb = this.web
  ): Promise<SPField[]> {
    let fields = web.lists
      .getByTitle(this._configuration.listNames[list] || list)
      .fields.select(...getClassProperties(SPField))
    if (filter) {
      fields = fields.filter(filter)
    }
    const listFields = await fields()
    return this._mapFields(listFields)
  }

  /**
   * Get fiels for the specified content type.
   *
   * @param contentTypeId Content type ID
   * @param web Web (default: `this.web`)
   */
  public async getContentTypeFields(
    contentTypeId: string,
    web: IWeb = this.web
  ): Promise<SPField[]> {
    const { Fields } = await this.web.contentTypes
      .getById(contentTypeId)
      .select(
        getClassProperties(SPField)
          .map((p) => `Fields/${p}`)
          .join(',')
      )
      .expand('Fields')<ISPContentType>()
    return this._mapFields(Fields)
  }

  /**
   * Get project admin roles
   */
  public async getProjectAdminRoles(): Promise<ProjectAdminRole[]> {
    const spItems = await this._getList('PROJECT_ADMIN_ROLES')
      .items.select(
        'ContentTypeId',
        'Id',
        'Title',
        'GtGroupName',
        'GtGroupLevel',
        'GtProjectFieldName',
        'GtProjectAdminPermissions/GtProjectAdminPermissionId'
      )
      .expand('GtProjectAdminPermissions')<SPProjectAdminRoleItem[]>()
    return spItems.map((item) => new ProjectAdminRole(item))
  }

  /**
   * Get project template by name. Using `DefaultCaching` by default.
   *
   * @param templateName Template name
   * @param cache Cache configuration to use (default: `DefaultCaching`)
   */
  public async getProjectTemplate(
    templateName: string,
    cache = DefaultCaching
  ): Promise<ProjectTemplate> {
    try {
      if (stringIsNullOrEmpty(templateName)) return null
      const [spItem] = await this._getList('PROJECT_TEMPLATE_CONFIGURATION')
        .items.select('*', 'FieldValuesAsText')
        .expand('FieldValuesAsText')
        .filter(`Title eq '${templateName}'`)
        .using(cache)<IProjectTemplateSPItem[]>()
      if (!spItem) return null
      return new ProjectTemplate(spItem)
    } catch (error) {
      return null
    }
  }

  /**
   * Get idea data for the current site URL as an `ItemFieldValues` object.
   */
  public async getIdeaData() {
    try {
      const url = this._configuration.spfxContext.pageContext.site.absoluteUrl
      const list = this._getList('IDEA_PROJECT_DATA')
      const [spItem] = await list.items.select('Id').filter(`GtSiteUrl eq '${url}'`)()
      if (!spItem) return null
      const item = list.items.getById(spItem.Id)
      const fieldValues = await getItemFieldValues(item)
      return fieldValues
    } catch (error) {
      return null
    }
  }

  /**
   * Update idea data for the current site URL. Updates the element in the idea
   * process list with a new idea decision. Normally it's set to approved and
   * synced when idea project data is synced to the project.
   *
   * @param fieldValues Item field values
   * @param ideaDecision New idea decision
   */
  public async updateIdeaData(
    fieldValues: ItemFieldValues,
    ideaDecision: string
  ): Promise<boolean> {
    try {
      const list = this._getList('IDEA_PROCESSING')
      const [spItem] = await list.items
        .filter(`GtIdeaProjectDataId eq '${fieldValues.id}'`)
        .top(1)
        .select('Id')()
      if (!spItem) return false
      const item = list.items.getById(spItem.Id)
      await item.update({
        GtIdeaDecision: ideaDecision
      })
    } catch (error) {
      return false
    }
  }

  /**
   * Retrieves the global settings from the "GLOBAL_SETTINGS" list.
   *
   * @returns A Promise that resolves to a Map containing the global settings.
   */
  public async getGlobalSettings(): Promise<Map<string, string>> {
    const intialMap = new Map<string, string>()
    try {
      const settingsList = this._getList('GLOBAL_SETTINGS')
      const spItems = await settingsList.items
        .select('Id', 'GtSettingsKey', 'GtSettingsValue')
        .filter('GtSettingsEnabled eq 1')
        .using(DefaultCaching)()
      return spItems.reduce((acc, cur) => {
        acc.set(cur.GtSettingsKey, cur.GtSettingsValue)
        return acc
      }, intialMap)
    } catch (error) {
      return intialMap
    }
  }

  /**
   * Get project details for the current site ID. Returns the id, title and
   * whether or not the project is a parent project. If no project is found
   * `null` is returned.
   */
  public async getProjectDetails(): Promise<IProjectDetails> {
    const siteId = this._configuration.spfxContext.pageContext.site.id
    const [project] = await this._getList('PROJECTS').items.filter(`GtSiteId eq '${siteId}'`)()
    if (!project) return null
    return {
      id: project.Id,
      title: project.Title,
      isParentProject: project.GtIsParentProject || project.GtIsProgram
    } as IProjectDetails
  }

  /**
   * Get list by `PortalDataServiceList` enum
   *
   * @param list List to get items from
   * @param listName Optional list name for overriding the default list name
   */
  private _getList(list: PortalDataServiceList, listName?: string): IList {
    return this.web.lists.getByTitle(listName ?? this._configuration.listNames[list])
  }
}
