import { LogLevel, Logger } from '@pnp/logging'
import * as strings from 'ProjectWebPartsStrings'
import {
  DataSource,
  ItemFieldValues,
  ProjectInformationChildProject,
  ProjectPhaseModel,
  searchAggregatedItems,
  format
} from 'pp365-shared-library'
import { DefaultCaching, SPDataAdapterBase } from 'pp365-shared-library/lib/data'
import {
  DataSourceService,
  IPhaseField,
  IProjectDataServiceParams,
  ProjectDataService
} from 'pp365-shared-library/lib/services'
import { SPFxContext } from 'pp365-shared-library/lib/types'
import { IConfigurationFile } from 'types'
import {
  IArchiveDocumentItem,
  IArchiveListItem,
  IArchiveLogEntry,
  IArchiveScopeStatus,
  IArchiveStatusInfo,
  IArchiveOperation,
  ISPDataAdapterConfiguration
} from './types'
import resource from 'SharedResources'
import { IProgressProps } from 'pp365-shared-library'
import { getNewEntityProperties } from './newEntityProperties'
import { syncPhaseToHub } from './syncPhaseToHub'

/** Provides project data, hub synchronization, matrix sources and archive operations. */
class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
  public project: ProjectDataService
  public dataSourceService: DataSourceService
  private _name = 'SPDataAdapter'
  private _childProjects: Promise<ProjectInformationChildProject[]>
  private _isParentProject: Promise<boolean>

  /**
   * Configures project services and clears memoized project relationships.
   */
  public async configure(
    spfxContext: SPFxContext,
    configuration: ISPDataAdapterConfiguration
  ): Promise<void> {
    await super.configure(spfxContext, configuration)
    this._childProjects = null
    this._isParentProject = null
    if (this.portalDataService?.web) {
      this.dataSourceService = new DataSourceService(this.portalDataService.web)
    }
    this.project = new ProjectDataService({
      ...this.settings,
      spfxContext,
      entityService: this.entityService,
      propertiesListName: resource.Lists_ProjectProperties_Title
    } as IProjectDataServiceParams)
  }

  /**
   * Get child projects for the current site from the hub projects list. Lazy and
   * memoized until the adapter is reconfigured, so matrix consumers share the request.
   * Returns an empty array when the hub is unavailable.
   */
  public getChildProjects(): Promise<ProjectInformationChildProject[]> {
    if (!this._childProjects) {
      this._childProjects = this.portalDataService?.isAvailable
        ? this.portalDataService.getChildProjects(
            this.spfxContext.pageContext.web.absoluteUrl,
            ProjectInformationChildProject
          )
        : Promise.resolve([])
    }
    return this._childProjects
  }

  /**
   * Checks whether the current site is a parent project or program by reading the
   * `GtIsParentProject` and `GtIsProgram` flags from the local properties list.
   * Memoized until the adapter is reconfigured; returns `false` on failure.
   */
  public isParentProject(): Promise<boolean> {
    if (!this._isParentProject) {
      this._isParentProject = (async () => {
        try {
          const [item] = await this.sp.web.lists
            .getByTitle(resource.Lists_ProjectProperties_Title)
            .items.top(1)
            .select('GtIsParentProject', 'GtIsProgram')()
          return !!(item?.GtIsParentProject || item?.GtIsProgram)
        } catch {
          return false
        }
      })()
    }
    return this._isParentProject
  }

  /**
   * Resolves a data source. If `name` is set the data source is fetched by title,
   * otherwise the default is resolved by its stable `GtDataSourceId` with a
   * fallback to the localized default title (for installs where the ID is not set).
   *
   * @param name Data source name from web part configuration (optional)
   * @param defaultDataSourceId `GtDataSourceId` of the default data source
   * @param defaultName Localized title of the default data source
   */
  public async resolveDataSource(
    name: string,
    defaultDataSourceId: string,
    defaultName: string
  ): Promise<DataSource> {
    const displayName = name || defaultName
    if (!this.dataSourceService) {
      throw new Error(format(strings.DataSourceError, displayName))
    }
    const dataSource = name
      ? await this.dataSourceService.getByName(name)
      : ((await this.dataSourceService.getById(defaultDataSourceId)) ??
        (await this.dataSourceService.getByName(defaultName)))
    if (!dataSource) {
      throw new Error(format(strings.DataSourceNotFound, displayName))
    }
    return dataSource
  }

  /**
   * Fetches items for the specified data source using SharePoint search, aggregated
   * across the current site's child projects (and the site itself when `includeSelf`
   * is `true`). The managed properties of the data source's columns are always
   * included in the select properties.
   *
   * @param includeSelf Whether to include items from the current site (default `true`)
   */
  public async fetchItemsFromDataSource(
    dataSource: DataSource,
    selectProperties: string[] = [],
    includeSelf: boolean = true
  ): Promise<Record<string, any>[]> {
    try {
      const childProjects = await this.getChildProjects()
      return await searchAggregatedItems(this.sp, {
        siteIds: childProjects.map((childProject) => childProject.siteId),
        queryTemplate: dataSource.searchQuery,
        selectProperties: [
          ...selectProperties,
          ...dataSource.columns.map((column) => column.fieldName).filter(Boolean)
        ],
        includeSelf,
        selfSiteId: this.spfxContext.pageContext.site.id.toString()
      })
    } catch (error) {
      Logger.log({
        message: `(${this._name}) (fetchItemsFromDataSource) Failed to fetch items from data source '${dataSource.title}': ${error?.message}`,
        level: LogLevel.Error
      })
      throw new Error(format(strings.DataSourceError, dataSource.title))
    }
  }

  /**
   * Maps project properties to the hub and updates or creates its entity.
   * Propagates failures so callers can distinguish a local save from a failed hub sync.
   */
  public async syncPropertyItemToHub(
    title: string,
    fieldValues: ItemFieldValues,
    templateParameters: Record<string, any>,
    progressFunc: (props: IProgressProps) => void
  ): Promise<void> {
    if (!this.entityService) {
      throw new Error(strings.HubSyncHubUnavailableReason)
    }
    progressFunc({
      label: strings.SyncProjectPropertiesValuesProgressLabel,
      description: strings.SyncProjectPropertiesValuesProgressDescription
    })
    const properties = await this.getMappedProjectProperties(fieldValues, {
      customSiteFieldsGroup: templateParameters.CustomSiteFields,
      projectContentTypeId: templateParameters.ProjectContentTypeId
    })
    const groupId = this.spfxContext.pageContext.legacyPageContext?.groupId
    const added = await this.entityService.ensureEntityItem(
      this.settings.siteId,
      this.settings.webUrl,
      { ...properties, Title: title },
      getNewEntityProperties(groupId, fieldValues, templateParameters.ProjectContentTypeId),
      // The setup's key, and the URL of a project registered by hand: an entity without the
      // site ID is found by these and updated, not doubled.
      { GtGroupId: groupId, GtSiteUrl: this.settings.webUrl }
    )
    Logger.log({
      message: `(${this._name}) (syncPropertyItemToHub) Successfully ${
        added ? 'added' : 'synced'
      } item to hub entity.`,
      data: { properties },
      level: LogLevel.Info
    })
  }

  /**
   * Change the project's phase on its properties item, then on its entity in the hub. A project
   * without an entity in the hub is registered with all its properties (`syncPropertyItemToHub`).
   *
   * A failed hub update does not undo the phase change: the error is returned for the caller to
   * report, while an error on the project's own item is thrown.
   *
   * @returns The error from the hub (also when it is out of reach), or `null` when it was updated
   */
  public async updateProjectPhase(
    phase: ProjectPhaseModel,
    phaseField: IPhaseField
  ): Promise<Error | null> {
    const phaseProperties = await this.project.updateProjectPhase(phase, phaseField, false)
    if (!this.entityService) return new Error(strings.HubSyncHubUnavailableReason)
    try {
      await syncPhaseToHub(this.entityService, this.settings.siteId, phaseProperties, async () => {
        const data = await this.project.getProjectInformationData()
        await this.syncPropertyItemToHub(
          this.spfxContext.pageContext.web.title,
          data.fieldValues,
          data.templateParameters ?? {},
          () => null
        )
      })
      return null
    } catch (error) {
      Logger.log({
        message: `(${this._name}) (updateProjectPhase) The phase was not changed in the hub: ${error?.message}`,
        level: LogLevel.Warning
      })
      return error
    }
  }

  /**
   * Resolves a taxonomy field's term set and associated text-field internal name.
   */
  public async getTermFieldContext(fieldName: string) {
    const field = await this.sp.web.fields
      .getByInternalNameOrTitle(fieldName)
      .select('InternalName', 'TermSetId', 'TextField')
      .using(DefaultCaching)<{
      InternalName: string
      TermSetId: string
      TextField: string
    }>()
    if (!field?.TextField) {
      throw new Error(
        `(${this._name}) (getTermFieldContext) Field '${fieldName}' has no TextField — is it a taxonomy field?`
      )
    }
    const textField = await this.sp.web.fields
      .getById(field.TextField)
      .select('InternalName')
      .using(DefaultCaching)<{ InternalName: string }>()
    return {
      fieldName: field.InternalName,
      termSetId: field.TermSetId,
      textField: textField.InternalName
    } as const
  }

  /**
   * Clear cache for the project.
   */
  public clearCache() {
    this.project?.clearCache()
  }

  /**
   * Get configuration files from the specified folder `folderPath` relative to
   * the configuration folder (`strings.SiteAssetsConfigurationFolder`) in Site Assets.
   *
   * @param folderPath Folder path relative to the configuration folder in Site Assets
   */
  public async getConfigurations(folderPath: string): Promise<IConfigurationFile[]> {
    if (!this.portalDataService?.isAvailable || !this.portalDataService?.web) {
      Logger.log({
        message: `(${this._name}) (getConfigurations) Portal data service unavailable — returning empty configuration list.`,
        level: LogLevel.Warning
      })
      return []
    }
    try {
      // From the hub's URL, since a member of «Minimum lesetilganger på hub» reads the folder but
      // not the hub itself. The root folder is read only when the URL is missing.
      const ServerRelativeUrl = this.portalDataService.url
        ? decodeURIComponent(new URL(this.portalDataService.url).pathname).replace(/\/$/, '')
        : (
            await this.portalDataService.web.rootFolder
              .select('ServerRelativeUrl')
              .using(DefaultCaching)<{
              ServerRelativeUrl: string
            }>()
          ).ServerRelativeUrl
      const folderRelativeUrl = `${ServerRelativeUrl}/${strings.SiteAssetsConfigurationFolder}/${folderPath}`
      const folder = this.portalDataService.web.getFolderByServerRelativePath(folderRelativeUrl)
      const files = await folder.files
        .select('Name', 'ServerRelativeUrl', 'ListItemAllFields/Title')
        .expand('ListItemAllFields')
        .using(DefaultCaching)()
      return files.map((file) => ({
        name: file.Name,
        title:
          file['ListItemAllFields']?.Title ?? `${strings.UnknownConfigurationName} (${file.Name})`,
        url: file.ServerRelativeUrl
      }))
    } catch (error) {
      Logger.log({
        message: `(${this._name}) (getConfigurations) Failed to load configuration files: ${
          error?.message ?? error
        }`,
        data: { folderPath, error },
        level: LogLevel.Warning
      })
      return []
    }
  }

  /**
   * Lists document archive candidates, returning no candidates if the library cannot be read.
   */
  public async getDocumentsForArchive(): Promise<IArchiveDocumentItem[]> {
    try {
      const documents = await this.sp.web.lists
        .getByTitle(resource.Lists_Documents_Title)
        .items.select('*', 'Id', 'Title', 'FileRef', 'FileLeafRef')
        .filter('FSObjType eq 0')
        .using(DefaultCaching)()

      return documents.map((doc): IArchiveDocumentItem => ({
        id: doc.Id,
        title: doc.FileLeafRef || doc.Title,
        projectPhaseId: doc?.GtProjectPhase?.TermGuid,
        documentTypeId: doc?.GtDocumentType?.TermGuid,
        url: doc.FileRef,
        type: 'file'
      }))
    } catch (error) {
      Logger.log({
        message: `(${this._name}) (getDocumentsForArchive) Error fetching documents: ${error.message}`,
        level: LogLevel.Warning
      })
      return []
    }
  }

  /**
   * Lists visible archive candidates excluding known system lists; returns none on failure.
   */
  public async getListsForArchive(): Promise<IArchiveListItem[]> {
    try {
      const lists = await this.sp.web.lists
        .select('Id', 'Title', 'DefaultViewUrl', 'Hidden', 'BaseTemplate', 'ItemCount')
        .filter('Hidden eq false and BaseTemplate ne 850')
        .using(DefaultCaching)()

      const filteredLists = lists.filter(
        (list) =>
          !list.Title.startsWith('_') &&
          list.Title !== 'Dokumenter' &&
          list.Title !== 'Style Library' &&
          list.Title !== 'Stilbibliotek' &&
          list.Title !== 'Site Assets' &&
          list.Title !== 'Nettstedsobjekter' &&
          list.Title !== 'Site Pages' &&
          list.Title !== 'Områdesider' &&
          list.Title !== 'Form Templates' &&
          list.Title !== 'Skjemamaler' &&
          list.Title !== 'Master Page Gallery' &&
          list.Title !== 'Solution Gallery' &&
          list.Title !== 'Theme Gallery' &&
          list.Title !== 'Web Part Gallery'
      )

      return filteredLists.map((list): IArchiveListItem => ({
        id: list.Id,
        title: list.Title,
        url: list.DefaultViewUrl,
        type: 'list',
        itemCount: list.ItemCount || 0
      }))
    } catch (error) {
      Logger.log({
        message: `(${this._name}) (getListsForArchive) Error fetching lists: ${error.message}`,
        level: LogLevel.Warning
      })
      return []
    }
  }

  /**
   * Writes an archive operation to the hub log without throwing write failures.
   *
   * @param reference URL or identifier of the archived document or list
   *
   * @returns The error when the entry was not written (also when the hub is out of reach), or
   * `null` when it was
   */
  public async writeToArchiveLog(
    title: string,
    status: string = strings.ArchiveLogStatusSuccess,
    operation: string,
    message: string,
    scope: string,
    webUrl: string,
    reference?: string
  ): Promise<Error | null> {
    // `web` is the site's own web when the hub's URL is unknown: ask whether the hub is in reach.
    if (!this.portalDataService?.isAvailable) {
      Logger.log({
        message: `(${this._name}) (writeToArchiveLog) Skipping archive log entry because portal data service is unavailable.`,
        data: { title, webUrl, operation },
        level: LogLevel.Warning
      })
      return new Error(strings.HubSyncHubUnavailableReason)
    }
    try {
      const archiveLogList = this.portalDataService.web.lists.getByTitle(
        resource.Lists_ArchiveLog_Title
      )

      const logItem: IArchiveLogEntry = {
        Title: title,
        GtLogStatus: status,
        GtLogOperation: operation,
        GtLogMessage: message,
        GtLogScope: scope,
        GtLogWebUrl: webUrl,
        GtLogReference: reference || ''
      }

      await archiveLogList.items.add(logItem)

      Logger.log({
        message: `(${this._name}) (writeToArchiveLog) Successfully wrote archive log entry: ${title}`,
        data: { logItem },
        level: LogLevel.Info
      })
      return null
    } catch (error) {
      Logger.log({
        message: `(${this._name}) (writeToArchiveLog) Failed to write archive log entry: ${error.message}`,
        data: { title, webUrl, message, operation, reference, status, error },
        level: LogLevel.Error
      })
      return error
    }
  }

  /**
   * Logs a phase-transition document archive request.
   *
   * @param errorMessage Overrides the message when the status is the localized error value
   *
   * @returns As `writeToArchiveLog`
   */
  public async logDocumentArchive(
    documentTitle: string,
    status: string = strings.ArchiveLogStatusSuccess,
    message: string,
    documentUrl: string,
    projectWebUrl: string,
    errorMessage?: string
  ): Promise<Error | null> {
    const logMessage =
      status === strings.ArchiveLogStatusError && errorMessage ? errorMessage : message || ''

    return await this.writeToArchiveLog(
      documentTitle,
      status,
      strings.ArchiveLogOperationPhaseTransition,
      logMessage,
      strings.ArchiveLogScopeDocument,
      projectWebUrl,
      documentUrl
    )
  }

  /**
   * Logs a phase-transition list archive request.
   *
   * @param errorMessage Formats the message when the status is the localized error value
   *
   * @returns As `writeToArchiveLog`
   */
  public async logListArchive(
    listTitle: string,
    status: string = strings.ArchiveLogStatusSuccess,
    message: string,
    listUrl: string,
    projectWebUrl: string,
    errorMessage?: string
  ): Promise<Error | null> {
    const logMessage =
      status === strings.ArchiveLogStatusError && errorMessage
        ? format(strings.ErrorArchiving, errorMessage)
        : message || ''

    return await this.writeToArchiveLog(
      listTitle,
      status,
      strings.ArchiveLogOperationPhaseTransition,
      logMessage,
      strings.ArchiveLogScopeList,
      projectWebUrl,
      listUrl
    )
  }

  /**
   * Summarizes a project's archive log by operation and calendar date.
   *
   * @returns Archive information, or `null` when no activity is found or the log cannot be read
   */
  public async getArchiveStatus(projectWebUrl: string): Promise<IArchiveStatusInfo | null> {
    if (!this.portalDataService?.web) {
      Logger.log({
        message: `(${this._name}) (getArchiveStatus) Portal data service unavailable — cannot retrieve archive status.`,
        level: LogLevel.Warning
      })
      return null
    }
    try {
      const archiveLogList = this.portalDataService.web.lists.getByTitle(
        resource.Lists_ArchiveLog_Title
      )

      const sanitizedUrl = (projectWebUrl ?? '').replace(/'/g, "''")
      const items = await archiveLogList.items
        .filter(`GtLogWebUrl eq '${sanitizedUrl}'`)
        .orderBy('Created', false)
        .select('Id', 'Created', 'GtLogOperation', 'GtLogMessage', 'GtLogScope', 'GtLogStatus')()

      if (items.length === 0) {
        return null
      }

      const operationGroups = new Map<string, any[]>()

      items.forEach((item) => {
        const createdDate = new Date(item.Created)
        const dateKey = createdDate.toDateString()
        const operation = item.GtLogOperation || 'Unknown'
        const groupKey = `${operation}|${dateKey}`

        if (!operationGroups.has(groupKey)) {
          operationGroups.set(groupKey, [])
        }
        operationGroups.get(groupKey).push(item)
      })

      const operations: IArchiveOperation[] = Array.from(operationGroups.entries())
        .filter(([, groupItems]) => groupItems.length > 0)
        .map(([groupKey, groupItems]) => {
          const [operation] = groupKey.split('|')
          const date = new Date(groupItems[0].Created)
          const mostRecentMessage = groupItems[0].GtLogMessage || ''

          let documentCount = 0
          let listCount = 0
          const scopeMap = new Map<string, { count: number; status: string; scope: string }>()

          groupItems.forEach((item) => {
            const scope = item.GtLogScope || 'N/A'
            const status = item.GtLogStatus || 'N/A'

            if (scope === strings.ArchiveLogScopeDocument) {
              documentCount++
            } else if (scope === strings.ArchiveLogScopeList) {
              listCount++
            }

            const scopeStatusKey = `${scope}|${status}`
            if (scopeMap.has(scopeStatusKey)) {
              scopeMap.get(scopeStatusKey).count++
            } else {
              scopeMap.set(scopeStatusKey, { count: 1, status, scope })
            }
          })

          const scopes: IArchiveScopeStatus[] = Array.from(scopeMap.entries()).map(([, data]) => ({
            scope: data.scope,
            count: data.count,
            status: data.status
          }))

          return {
            operation,
            date,
            message: mostRecentMessage,
            documentCount,
            listCount,
            totalItems: groupItems.length,
            scopes
          }
        })

      operations.sort((a, b) => b.date.getTime() - a.date.getTime())

      if (operations.length === 0) return null

      const result: IArchiveStatusInfo = {
        lastArchiveDate: operations[0].date,
        operations
      }

      Logger.log({
        message: `(${this._name}) (getArchiveStatus) Retrieved archive status`,
        data: { projectWebUrl, result },
        level: LogLevel.Info
      })

      return result
    } catch (error) {
      Logger.log({
        message: `(${this._name}) (getArchiveStatus) Failed to get archive status: ${error.message}`,
        data: { projectWebUrl, error },
        level: LogLevel.Error
      })
      return null
    }
  }
}

export default new SPDataAdapter()
