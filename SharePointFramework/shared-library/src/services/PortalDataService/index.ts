/* eslint-disable no-console */
import { find } from '@microsoft/sp-lodash-subset'
import { AssignFrom, dateAdd, PnPClientStorage, stringIsNullOrEmpty } from '@pnp/core'
import { Logger, LogLevel } from '@pnp/logging'
import { IFolder } from '@pnp/sp/folders'
import { ICamlQuery, IList } from '@pnp/sp/lists'
import '@pnp/sp/presets/all'
import { IItemUpdateResultData, spfi, SPFI } from '@pnp/sp/presets/all'
import { PermissionKind } from '@pnp/sp/security'
import { IWeb } from '@pnp/sp/webs'
import initJsom, { ExecuteJsomQuery as executeQuery } from 'spfx-jsom'
import { createSpfiInstance, DefaultCaching } from '../../data'
import { ISPContentType } from '../../interfaces'
import {
  PortfolioOverviewView,
  ProjectAdminRole,
  ProjectColumn,
  ProjectColumnConfig,
  SectionModel,
  SPField,
  SPPortfolioOverviewViewItem,
  SPProjectAdminRoleItem,
  SPProjectColumnConfigItem,
  SPProjectColumnItem,
  StatusReport,
  StatusReportAttachment
} from '../../models'
import { getClassProperties, makeUrlAbsolute, transformFieldXml } from '../../util'
import {
  GetStatusReportsOptions,
  IPortalDataServiceConfiguration,
  PortalDataServiceDefaultConfiguration,
  PortalDataServiceList,
  SyncListOptions as SyncListParams,
  SyncListReturnType
} from './types'

export class PortalDataService {
  private _configuration: IPortalDataServiceConfiguration
  private _isConfigured: boolean = false
  private _sp: SPFI
  private _spPortal: SPFI
  public web: IWeb
  public url: string

  /**
   * Configure PortalDataService
   *
   * @param configuration Configuration for PortalDataService
   */
  public async configure(
    configuration: IPortalDataServiceConfiguration
  ): Promise<PortalDataService> {
    this._configuration = { ...PortalDataServiceDefaultConfiguration, ...configuration }
    this._sp = createSpfiInstance(this._configuration.spfxContext)
    await this.initPortalSite()
    this._isConfigured = true
    return this
  }

  /**
   * Returns `true` if the `PortalDataService` is configured, `false` otherwise.
   */
  public get isConfigured(): boolean {
    return this._isConfigured
  }

  /**
   * Initialize portal site setting `url`, `_spPortal` and `web` properties. Caches the result in local storage
   * to avoid unnecessary requests.
   *
   * @param expire Expire (defaults to 1 year)
   */
  private async initPortalSite(expire: Date = dateAdd(new Date(), 'year', 1)): Promise<void> {
    try {
      const hubSiteId =
        this._configuration.spfxContext.pageContext.legacyPageContext.hubSiteId || ''
      try {
        const { SiteUrl } = await (
          await fetch(
            `${this._configuration.spfxContext.pageContext.web.absoluteUrl}/_api/HubSites/GetById('${hubSiteId}')`,
            {
              method: 'GET',
              headers: {
                Accept: 'application/json;odata=nometadata'
              },
              credentials: 'include'
            }
          )
        ).json()
        this.url = SiteUrl
      } catch (error) {
        this.url = await new PnPClientStorage().local.getOrPut(
          `hubsite_${hubSiteId.replace(/-/g, '')}_url`,
          async () => {
            const { PrimarySearchResults } = await this._sp.search({
              Querytext: `SiteId:${hubSiteId} contentclass:STS_Site`,
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
   */
  public async getProjectColumns(): Promise<ProjectColumn[]> {
    try {
      const spItems = await this._getList('PROJECT_COLUMNS').items.select(
        ...getClassProperties(SPProjectColumnItem)
      )<SPProjectColumnItem[]>()
      return spItems.map((item) => new ProjectColumn(item))
    } catch (error) {
      return []
    }
  }

  /**
   * Get project status sections using caching.
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
      const properties: Record<string, string> = {
        GtModerationStatus: publishedString,
        GtLastReportDate: reportDate
      }
      await Promise.all([
        projectStatusList.items.getById(report.id).update(properties),
        ...attachments.map((att) =>
          attachmentsFolder.files.addUsingPath(att.url, att.content, {
            Overwrite: att.shouldOverWrite
          })
        )
      ])
      return new StatusReport({ ...report.item, ...properties }, publishedString)
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
   * Get project column configuration using caching.
   */
  public async getProjectColumnConfig(): Promise<ProjectColumnConfig[]> {
    const spItems = await this._getList('PROJECT_COLUMN_CONFIGURATION')
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
   * Get portfolio overview views. Returns all shared views and personal views.
   */
  public async getPortfolioOverviewViews(): Promise<PortfolioOverviewView[]> {
    const email = this._configuration.spfxContext.pageContext.user.email
    const filter = `GtPortfolioIsPersonalView eq 0 or (GtPortfolioIsPersonalView eq 1 and Author/EMail eq '${email}')`
    const spItems = await this._getList('PORTFOLIO_VIEWS')
      .items.select(...getClassProperties(SPPortfolioOverviewViewItem))
      .filter(filter)
      .orderBy('GtSortOrder', true)<SPPortfolioOverviewViewItem[]>()
    return spItems.map((item) => new PortfolioOverviewView(item))
  }

  /**
   * Get list form urls
   *
   * @param list List key
   */
  public async getListFormUrls(
    list: PortalDataServiceList
  ): Promise<{ defaultNewFormUrl: string; defaultEditFormUrl: string }> {
    const urls = await this._getList(list)
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
   */
  public async currentUserHasPermissionsToList(
    list: PortalDataServiceList,
    permissionKind: PermissionKind
  ): Promise<boolean> {
    return await this._getList(list).currentUserHasPermissions(permissionKind)
  }

  /**
   * Sync list with project properties from hub site.
   *
   * Skips fields that has `ShowInEditForm` set to `FALSE`
   *
   * @param params Sync list parameters
   */
  public async syncList(params: SyncListParams): Promise<SyncListReturnType> {
    const fieldsAdded: SPField[] = []
    const web = spfi(params.url).using(AssignFrom(this._sp.web)).web
    const { jsomContext } = await initJsom(params.url, { loadTaxonomy: true })
    const [hubContentType, targetSiteFields, ensureList] = await Promise.all([
      this._getHubContentType(params.contentTypeId),
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
          level: LogLevel.Info,
          data: { fieldLink, siteField: !!siteField }
        })
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
      } catch (error) {}
    }
    try {
      Logger.log({
        message: `(PortalDataService) (syncList) Attempting to add field [TemplateParameters] to list ${params.listName}.`,
        level: LogLevel.Info
      })
      const templateParametersField = spList
        .get_fields()
        .addFieldAsXml(
          this._configuration.templateParametersFieldXml,
          false,
          SP.AddFieldOptions.addToDefaultContentType
        )
      templateParametersField.updateAndPushChanges(true)
      await executeQuery(jsomContext)
    } catch {}
    if (ensureList.created && params.properties) {
      ensureList.list.items.add(params.properties)
    }
    return { list: ensureList, fieldsAdded }
  }

  /**
   * Get hub content type
   *
   * @param contentTypeId Content type ID
   */
  private async _getHubContentType(contentTypeId: string): Promise<ISPContentType> {
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
   * @param web Web
   */
  private async _getSiteFields(web: IWeb): Promise<SPField[]> {
    const siteFields = await web.fields.select(...getClassProperties(SPField))<SPField[]>()
    return siteFields
  }

  /**
   * Get files
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
   * Add status report with the specified `properties` and `contentTypeId`
   *
   * @param properties Properties
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
    const itemAddResult = await list.items.add(properties)
    return new StatusReport(itemAddResult.data)
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
    publishedString,
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
      const reports = (await items()).map((i) => new StatusReport(i, publishedString))
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
   * @param web Web
   */
  public getListFields(
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
    return fields<SPField[]>()
  }

  /**
   * Get project admin roles
   */
  public async getProjectAdminRoles(): Promise<ProjectAdminRole[]> {
    const spItems = await this.web.lists
      .getByTitle(this._configuration.listNames.PROJECT_ADMIN_ROLES)
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
   * Get list by `PortalDataServiceList` enum
   *
   * @param list List to get items from
   */
  private _getList(list: PortalDataServiceList): IList {
    return this.web.lists.getByTitle(this._configuration.listNames[list])
  }
}
