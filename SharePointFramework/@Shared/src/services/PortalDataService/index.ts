/* eslint-disable no-console */
import { find } from '@microsoft/sp-lodash-subset'
import { stringIsNullOrEmpty } from '@pnp/core'
import { Logger, LogLevel, PnPLogging } from '@pnp/logging'
import { spfi, SPFI, SPFx } from '@pnp/sp'
import '@pnp/sp/attachments'
import { IAttachmentFileInfo } from '@pnp/sp/attachments'
import '@pnp/sp/content-types'
import '@pnp/sp/fields'
import '@pnp/sp/files'
import '@pnp/sp/folders'
import '@pnp/sp/items'
import '@pnp/sp/lists'
import { ICamlQuery, IListEnsureResult } from '@pnp/sp/lists'
import { IWeb } from '@pnp/sp/webs'
import initJsom, { ExecuteJsomQuery as executeQuery } from 'spfx-jsom'
import { makeUrlAbsolute } from '../../helpers/makeUrlAbsolute'
import { transformFieldXml } from '../../helpers/transformFieldXml'
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
  StatusReport
} from '../../models'
import { GetStatusReportsOptions } from './GetStatusReportsOptions'
import {
  IPortalDataServiceConfiguration,
  PortalDataServiceDefaultConfiguration,
  PortalDataServiceList
} from './IPortalDataServiceConfiguration'

export class PortalDataService {
  private _configuration: IPortalDataServiceConfiguration
  public sp: SPFI

  /**
   * Configure PortalDataService
   *
   * @param configuration Configuration for PortalDataService
   */
  public configure(configuration: IPortalDataServiceConfiguration): PortalDataService {
    this._configuration = { ...PortalDataServiceDefaultConfiguration, ...configuration }
    this.sp = spfi(this._configuration.url).using(SPFx(this._configuration.spfxContext)).using(PnPLogging(LogLevel.Warning))
    return this
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
   * Get project columns
   */
  public async getProjectColumns(): Promise<ProjectColumn[]> {
    try {
      const spItems = await this.sp.web.lists
        .getByTitle(this._configuration.listNames.PROJECT_COLUMNS)
        .items.select(...Object.keys(new SPProjectColumnItem()))()
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
      const items = await this.sp.web.lists
        .getByTitle(this._configuration.listNames.STATUS_SECTIONS)
        .items()
      return items.map((item) => new SectionModel(item))
    } catch (error) {
      return []
    }
  }

  /**
   * Update status report, and add snapshot as attachment.
   *
   * @param report Status report
   * @param properties Properties
   * @param attachment Attachment
   * @param publishedString String value for published state
   */
  public async updateStatusReport(
    report: StatusReport,
    properties: Record<string, string>,
    attachment?: IAttachmentFileInfo,
    publishedString?: string
  ): Promise<StatusReport> {
    const list = this.sp.web.lists.getByTitle(this._configuration.listNames.PROJECT_STATUS)
    if (attachment) {
      try {
        await list.items.getById(report.id).attachmentFiles.add(attachment.name, attachment.content)
      } catch (error) {}
    }
    try {
      await list.items.getById(report.id).update(properties)
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
    await this.sp.web.lists
      .getByTitle(this._configuration.listNames.PROJECT_STATUS)
      .items.getById(id)
      .delete()
  }

  /**
   * Get project column configuration using caching.
   */
  public async getProjectColumnConfig(): Promise<ProjectColumnConfig[]> {
    const spItems = await this.sp.web.lists
      .getByTitle(this._configuration.listNames.PROJECT_COLUMN_CONFIGURATION)
      .items.orderBy('ID', true)
      .expand('GtPortfolioColumn')
      .select(
        ...Object.keys(new SPProjectColumnConfigItem()),
        'GtPortfolioColumn/Title',
        'GtPortfolioColumn/GtInternalName'
      )<SPProjectColumnConfigItem[]>()
    return spItems.map((item) => new ProjectColumnConfig(item))
  }

  /**
   * Get portfolio overview views
   */
  public async getPortfolioOverviewViews(): Promise<PortfolioOverviewView[]> {
    const spItems = await this.sp.web.lists
      .getByTitle(this._configuration.listNames.PORTFOLIO_VIEWS)
      .items.orderBy('GtSortOrder', true)
      <SPPortfolioOverviewViewItem[]>()
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
    const urls = await this.sp.web.lists
      .getByTitle(this._configuration.listNames[list])
      .select('DefaultNewFormUrl', 'DefaultEditFormUrl')
      .expand('DefaultNewFormUrl', 'DefaultEditFormUrl')<{ DefaultNewFormUrl: string; DefaultEditFormUrl: string }>()
    return {
      defaultNewFormUrl: makeUrlAbsolute(urls.DefaultNewFormUrl),
      defaultEditFormUrl: makeUrlAbsolute(urls.DefaultEditFormUrl)
    }
  }

  /**
   * Sync list from hub to the specified URL
   *
   * Skips fields that has `ShowInEditForm` set to `FALSE`
   *
   * @param url Url
   * @param listName List name
   * @param contentTypeId Content type id for project properties
   * @param properties Create a new item in the list with specified properties if the list was created
   */
  public async syncList(
    url: string,
    listName: string,
    contentTypeId: string,
    properties?: Record<string, string>
  ): Promise<IListEnsureResult> {
    const targetWeb = spfi(url).using(SPFx(this._configuration.spfxContext)).using(PnPLogging(LogLevel.Warning)).web
    const { jsomContext } = await initJsom(url, { loadTaxonomy: true })
    const [hubContentType, targetSiteFields, ensureList] = await Promise.all([
      this._getHubContentType(contentTypeId),
      this._getSiteFields(targetWeb),
      targetWeb.lists.ensure(listName, '', 100, false, {
        Hidden: true,
        EnableAttachments: false,
        EnableVersioning: true
      })
    ])
    const listFields = await this.getListFields(listName, undefined, targetWeb)
    const spList = jsomContext.web.get_lists().getByTitle(listName)
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
          message: `(PortalDataService) (syncList) Field [${field.InternalName}] already exists on list [${listName}].`,
          level: LogLevel.Info
        })
        continue
      }
      try {
        const [fieldLink] = hubContentType.FieldLinks.filter((fl) => fl.Name === field.InternalName)
        Logger.log({
          message: `(PortalDataService) (syncList) Adding field [${field.InternalName}] to list [${listName}].`,
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
        }
        await executeQuery(jsomContext)
      } catch (error) {}
    }
    try {
      Logger.log({
        message: `(PortalDataService) (syncList) Attempting to add field [TemplateParameters] to list ${listName}.`,
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
    if (ensureList.created && properties) {
      ensureList.list.items.add(properties)
    }
    return ensureList
  }

  /**
   * Get hub content type
   *
   * @param contentTypeId Content type ID
   */
  private async _getHubContentType(contentTypeId: string): Promise<ISPContentType> {
    const contentType = await this.sp.web.contentTypes
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
      .expand('Fields', 'FieldLinks')
      <ISPContentType>()
    return contentType
  }

  /**
   * Get site fields
   *
   * @param web Web
   */
  private async _getSiteFields(web: IWeb): Promise<SPField[]> {
    const siteFields = await web.fields.select(...Object.keys(new SPField()))<SPField[]>()
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
    const files = await this.sp.web.lists.getByTitle(listName).rootFolder.files()
    return files.map((file) => new constructor(file, this.sp.web))
  }

  /**
   * Get items
   *
   * @param listName List name
   * @param constructor Constructor
   * @param query Query
   * @param expands Expands
   */
  public async getItems<T>(
    listName: string,
    constructor: new (item: any, web: IWeb) => T,
    query?: ICamlQuery,
    expands?: string[]
  ): Promise<T[]> {
    try {
      const list = this.sp.web.lists.getByTitle(listName)
      let items: any[]
      if (query) {
        items = await list.getItemsByCAMLQuery(query, ...(expands ?? []))
      } else {
        items = await list.items()
      }
      return items.map((item) => new constructor(item, this.sp.web))
    } catch (error) {
      throw error
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
    const list = this.sp.web.lists.getByTitle(this._configuration.listNames.PROJECT_STATUS)
    if (contentTypeId) {
      const contentTypes = await list.contentTypes()
      const ct = find(contentTypes, (ct) => ct.StringId.indexOf(contentTypeId) === 0)
      if (ct) properties.ContentTypeId = ct.StringId
    }
    const itemAddResult = await list.items.add(properties)
    return new StatusReport(itemAddResult.data)
  }

  /**
   * Get status reports using caching by default. Can be turned off by setting
   * `useCaching` to `false`.
   *
   * @param options Options
   */
  public async getStatusReports({
    filter = '',
    top,
    select,
    publishedString
  }: GetStatusReportsOptions): Promise<StatusReport[]> {
    if (!this._configuration.siteId) throw 'Property {siteId} missing in configuration'
    if (stringIsNullOrEmpty(filter)) filter = `GtSiteId eq '${this._configuration.siteId}'`
    try {
      let items = this.sp.web.lists
        .getByTitle(this._configuration.listNames.PROJECT_STATUS)
        .items.filter(filter)
        .expand('FieldValuesAsText', 'AttachmentFiles')
        .orderBy('Id', false)
      if (top) items = items.top(top)
      if (select) items = items.select(...select)
      return (await items()).map((i) => new StatusReport(i, publishedString))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get status report list props
   */
  public getStatusReportListProps(): Promise<{ DefaultEditFormUrl: string }> {
    try {
      return this.sp.web.lists
        .getByTitle(this._configuration.listNames.PROJECT_STATUS)
        .select('DefaultEditFormUrl')
        .expand('DefaultEditFormUrl')
        <{ DefaultEditFormUrl: string }>()
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
    web: IWeb = this.sp.web
  ): Promise<SPField[]> {
    let fields = web.lists
      .getByTitle(this._configuration.listNames[list] || list)
      .fields.select(...Object.keys(new SPField()))
    if (filter) {
      fields = fields.filter(filter)
    }
    return fields<SPField[]>()
  }

  /**
   * Get project admin roles using caching (`sessionStorage` with 60 minutes expiry)
   */
  public async getProjectAdminRoles(): Promise<ProjectAdminRole[]> {
    const spItems = await this.sp.web.lists
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
      .expand('GtProjectAdminPermissions')
      <SPProjectAdminRoleItem[]>()
    return spItems.map((item) => new ProjectAdminRole(item))
  }
}
