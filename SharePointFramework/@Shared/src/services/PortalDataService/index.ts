/* eslint-disable no-console */
import { find } from '@microsoft/sp-lodash-subset'
import { dateAdd, stringIsNullOrEmpty, TypedHash } from '@pnp/common'
import { Logger, LogLevel } from '@pnp/logging'
import { AttachmentFileInfo, CamlQuery, ListEnsureResult, Web } from '@pnp/sp'
import initJsom, { ExecuteJsomQuery as executeQuery } from 'spfx-jsom'
import { makeUrlAbsolute } from '../../helpers/makeUrlAbsolute'
import { transformFieldXml } from '../../helpers/transformFieldXml'
import { ISPContentType } from '../../interfaces'
import {
  PortfolioOverviewView,
  ProjectColumn,
  ProjectColumnConfig,
  SectionModel,
  SPField,
  SPPortfolioOverviewViewItem,
  SPProjectColumnConfigItem,
  SPProjectColumnItem,
  StatusReport,
  ProjectAdminRole,
  SPProjectAdminRoleItem
} from '../../models'
import {
  IPortalDataServiceConfiguration,
  PortalDataServiceDefaultConfiguration,
  PortalDataServiceList
} from './IPortalDataServiceConfiguration'

export type GetStatusReportsOptions = {
  filter?: string
  top?: number
  select?: string[]
  publishedString?: string
}

export class PortalDataService {
  private _configuration: IPortalDataServiceConfiguration
  public web: Web

  /**
   * Configure PortalDataService
   *
   * @param configuration Configuration for PortalDataService
   */
  public configure(configuration: IPortalDataServiceConfiguration): PortalDataService {
    this._configuration = { ...PortalDataServiceDefaultConfiguration, ...configuration }
    if (typeof this._configuration.urlOrWeb === 'string') {
      this.web = new Web(this._configuration.urlOrWeb)
    } else {
      this.web = this._configuration.urlOrWeb
    }
    return this
  }

  /**
   * Get project columns
   */
  public async getProjectColumns(): Promise<ProjectColumn[]> {
    try {
      const spItems = await this.web.lists
        .getByTitle(this._configuration.listNames.PROJECT_COLUMNS)
        .items.select(...Object.keys(new SPProjectColumnItem()))
        .get<SPProjectColumnItem[]>()
      return spItems.map((item) => new ProjectColumn(item))
    } catch (error) {
      return []
    }
  }

  /**
   * Get project status sections
   */
  public async getProjectStatusSections(): Promise<SectionModel[]> {
    try {
      const items = await this.web.lists
        .getByTitle(this._configuration.listNames.STATUS_SECTIONS)
        .items.get()
      return items.map((item) => new SectionModel(item))
    } catch (error) {
      return []
    }
  }

  /**
   * Update status report, and add snapshot as attachment
   *
   * @param id Id
   * @param properties Properties
   * @param attachment Attachment
   */
  public async updateStatusReport(
    id: number,
    properties: TypedHash<string>,
    attachment?: AttachmentFileInfo
  ): Promise<void> {
    const list = this.web.lists.getByTitle(this._configuration.listNames.PROJECT_STATUS)
    if (attachment) {
      try {
        await list.items.getById(id).attachmentFiles.addMultiple([attachment])
      } catch (error) {
        Logger.log({
          message: `(updateStatusReport): Unable to attach PNG snapshot: ${error.message}`,
          level: LogLevel.Info
        })
      }
    }
    try {
      await list.items.getById(id).update(properties)
    } catch (error) {
      Logger.log({
        message: `(updateStatusReport): Unable to update status report: ${error.message}`,
        level: LogLevel.Info
      })
      throw error
    }
  }

  /**
   * Delete status report by ID
   *
   * @param id Id
   */
  public async deleteStatusReport(id: number): Promise<void> {
    await this.web.lists
      .getByTitle(this._configuration.listNames.PROJECT_STATUS)
      .items.getById(id)
      .delete()
  }

  /**
   * Get project column configuration
   */
  public async getProjectColumnConfig(): Promise<ProjectColumnConfig[]> {
    const spItems = await this.web.lists
      .getByTitle(this._configuration.listNames.PROJECT_COLUMN_CONFIGURATION)
      .items.orderBy('ID', true)
      .expand('GtPortfolioColumn')
      .select(
        ...Object.keys(new SPProjectColumnConfigItem()),
        'GtPortfolioColumn/Title',
        'GtPortfolioColumn/GtInternalName'
      )
      .get<SPProjectColumnConfigItem[]>()
    return spItems.map((item) => new ProjectColumnConfig(item))
  }

  /**
   * Get portfolio overview views
   */
  public async getPortfolioOverviewViews(): Promise<PortfolioOverviewView[]> {
    const spItems = await this.web.lists
      .getByTitle(this._configuration.listNames.PORTFOLIO_VIEWS)
      .items.orderBy('GtSortOrder', true)
      .get<SPPortfolioOverviewViewItem[]>()
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
    const urls = await this.web.lists
      .getByTitle(this._configuration.listNames[list])
      .select('DefaultNewFormUrl', 'DefaultEditFormUrl')
      .expand('DefaultNewFormUrl', 'DefaultEditFormUrl')
      .get<{ DefaultNewFormUrl: string; DefaultEditFormUrl: string }>()
    return {
      defaultNewFormUrl: makeUrlAbsolute(urls.DefaultNewFormUrl),
      defaultEditFormUrl: makeUrlAbsolute(urls.DefaultEditFormUrl)
    }
  }

  /**
   * Sync list from hub to the specified URL
   *
   * Skips fields that has ShowInEditForm set to FALSE
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
    properties?: TypedHash<string>
  ): Promise<ListEnsureResult> {
    const targetWeb = new Web(url)
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
      .expand('Fields', 'FieldLinks')
      .get<ISPContentType>()
    return contentType
  }

  /**
   * Get site fields
   *
   * @param web Web
   */
  private async _getSiteFields(web: Web): Promise<SPField[]> {
    const siteFields = await web.fields.select(...Object.keys(new SPField())).get<SPField[]>()
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
    constructor: new (file: any, web: Web) => T
  ): Promise<T[]> {
    const files = await this.web.lists.getByTitle(listName).rootFolder.files.usingCaching().get()
    return files.map((file) => new constructor(file, this.web))
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
    constructor: new (item: any, web: Web) => T,
    query?: CamlQuery,
    expands: string[] = []
  ): Promise<T[]> {
    try {
      const list = this.web.lists.getByTitle(listName)
      let items: any[]
      if (query) {
        items = await list.usingCaching().getItemsByCAMLQuery(query, ...expands)
      } else {
        items = await list.usingCaching().items.usingCaching().get()
      }
      return items.map((item) => new constructor(item, this.web))
    } catch (error) {
      throw error
    }
  }

  /**
   * Add status report
   *
   * @param properties Properties
   * @param contentTypeId Content type id
   * @param defaultEditFormUrl Default edit form URL
   */
  public async addStatusReport(
    properties: TypedHash<string | number | boolean>,
    contentTypeId: string,
    defaultEditFormUrl: string
  ): Promise<StatusReport> {
    const list = this.web.lists.getByTitle(this._configuration.listNames.PROJECT_STATUS)
    if (contentTypeId) {
      const contentTypes = await list.contentTypes.get()
      const ct = find(contentTypes, (ct) => ct.StringId.indexOf(contentTypeId) === 0)
      if (ct) properties.ContentTypeId = ct.StringId
    }
    const itemAddResult = await list.items.add(properties)
    return new StatusReport(itemAddResult.data).setDefaultEditFormUrl(defaultEditFormUrl)
  }

  /**
   * Get status reports
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
      let items = this.web.lists
        .getByTitle(this._configuration.listNames.PROJECT_STATUS)
        .items.filter(filter)
        .expand('FieldValuesAsText', 'AttachmentFiles')
        .orderBy('Id', false)
      if (top) items = items.top(top)
      if (select) items = items.select(...select)
      return (await items.get()).map((i) => new StatusReport(i, publishedString))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get status report list props
   */
  public getStatusReportListProps(): Promise<{ DefaultEditFormUrl: string }> {
    try {
      return this.web.lists
        .getByTitle(this._configuration.listNames.PROJECT_STATUS)
        .select('DefaultEditFormUrl')
        .expand('DefaultEditFormUrl')
        .usingCaching({
          key: 'projectstatus_defaulteditformurl',
          storeName: 'session',
          expiration: dateAdd(new Date(), 'day', 1)
        })
        .get<{ DefaultEditFormUrl: string }>()
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
    web: Web = this.web
  ): Promise<SPField[]> {
    let fields = web.lists
      .getByTitle(this._configuration.listNames[list] || list)
      .fields.select(...Object.keys(new SPField()))
    if (filter) {
      fields = fields.filter(filter)
    }
    return fields.get<SPField[]>()
  }

  /**
   * Get project admin roles using caching (`sessionStorage` with 60 minutes expiry)
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
      .expand('GtProjectAdminPermissions')
      .usingCaching({
        key: 'project_admin_roles',
        storeName: 'session',
        expiration: dateAdd(new Date(), 'minute', 60)
      })
      .get<SPProjectAdminRoleItem[]>()
    return spItems.map((item) => new ProjectAdminRole(item))
  }
}
