import { IProgressIndicatorProps } from '@fluentui/react/lib/ProgressIndicator'
import { LogLevel, Logger } from '@pnp/logging'
import * as strings from 'ProjectWebPartsStrings'
import { ItemFieldValues } from 'pp365-shared-library'
import { DefaultCaching, SPDataAdapterBase } from 'pp365-shared-library/lib/data'
import { IProjectDataServiceParams, ProjectDataService } from 'pp365-shared-library/lib/services'
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
import { format } from '@fluentui/react'

class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
  public project: ProjectDataService
  private _name = 'SPDataAdapter'

  /**
   * Configure the SP data adapter
   *
   * @param spfxContext SPFx context
   * @param configuration Configuration
   */
  public async configure(
    spfxContext: SPFxContext,
    configuration: ISPDataAdapterConfiguration
  ): Promise<void> {
    await super.configure(spfxContext, configuration)
    this.project = new ProjectDataService({
      ...this.settings,
      spfxContext,
      entityService: this.entityService,
      propertiesListName: resource.Lists_ProjectProperties_Title
    } as IProjectDataServiceParams)
  }

  /**
   * Sync property item from site to associated hub. `this.getMappedProjectProperties` is used to
   * map the properties item fields to the hub fields. `updateEntityItem` from `sp-entityportal-service`
   * is used to update the hub entity item. If any errors occur, the original error is passed to the caller.
   *
   * @param title Title of the project
   * @param fieldValues Field values for the properties item
   * @param templateParameters Template parameters
   * @param progressFunc Progress function
   */
  public async syncPropertyItemToHub(
    title: string,
    fieldValues: ItemFieldValues,
    templateParameters: Record<string, any>,
    progressFunc: (props: IProgressIndicatorProps) => void
  ): Promise<void> {
    try {
      progressFunc({
        label: strings.SyncProjectPropertiesValuesProgressLabel,
        description: strings.SyncProjectPropertiesValuesProgressDescription
      })
      const properties = await this.getMappedProjectProperties(fieldValues, {
        customSiteFieldsGroup: templateParameters.CustomSiteFields,
        projectContentTypeId: templateParameters.ProjectContentTypeId
      })
      await this.entityService.updateEntityItem(this.settings.siteId, {
        ...properties,
        Title: title
      })
      Logger.log({
        message: `(${this._name}) (syncPropertyItemToHub) Successfully synced item to hub entity.`,
        data: { properties },
        level: LogLevel.Info
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Fetch term field context. Fetches the `InternalName` and `TermSetId` for the field,
   * as well as the `InternalName` for the text field.
   *
   * @param fieldName Field name for phase
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
    this.project.clearCache()
  }

  /**
   * Get configuration files from the specified folder `folderPath` relative to
   * the configuration folder (`strings.SiteAssetsConfigurationFolder`) in Site Assets.
   *
   * @param folderPath Folder path relative to the configuration folder in Site Assets
   */
  public async getConfigurations(folderPath: string): Promise<IConfigurationFile[]> {
    try {
      const { ServerRelativeUrl } = await this.portalDataService.web.rootFolder
        .select('ServerRelativeUrl')
        .using(DefaultCaching)<{
        ServerRelativeUrl: string
      }>()
      const folderRelativeUrl = `${ServerRelativeUrl}/${strings.SiteAssetsConfigurationFolder}/${folderPath}`
      const folder = this.portalDataService.web.getFolderByServerRelativePath(folderRelativeUrl)
      const files = await folder.files
        .select('Name', 'ServerRelativeUrl', 'ListItemAllFields/Title')
        .expand('ListItemAllFields')
        .using(DefaultCaching)()
      return files.map((file) => ({
        name: file.Name,
        title:
          file['ListItemAllFields']['Title'] ??
          `${strings.UnknownConfigurationName} (${file.Name})`,
        url: file.ServerRelativeUrl
      }))
    } catch {
      return []
    }
  }

  /**
   * Get documents from the Documents library for archiving
   */
  public async getDocumentsForArchive(): Promise<IArchiveDocumentItem[]> {
    try {
      const documents = await this.sp.web.lists
        .getByTitle(resource.Lists_Documents_Title)
        .items.select('*', 'Id', 'Title', 'FileRef', 'FileLeafRef')
        .filter('FSObjType eq 0')
        .using(DefaultCaching)()

      return documents.map(
        (doc): IArchiveDocumentItem => ({
          id: doc.Id,
          title: doc.FileLeafRef || doc.Title,
          projectPhaseId: doc?.GtProjectPhase?.TermGuid,
          documentTypeId: doc?.GtDocumentType?.TermGuid,
          url: doc.FileRef,
          type: 'file'
        })
      )
    } catch (error) {
      Logger.log({
        message: `(${this._name}) (getDocumentsForArchive) Error fetching documents: ${error.message}`,
        level: LogLevel.Warning
      })
      return []
    }
  }

  /**
   * Get site lists for archiving (excluding system lists)
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

      return filteredLists.map(
        (list): IArchiveListItem => ({
          id: list.Id,
          title: list.Title,
          url: list.DefaultViewUrl,
          type: 'list',
          itemCount: list.ItemCount || 0
        })
      )
    } catch (error) {
      Logger.log({
        message: `(${this._name}) (getListsForArchive) Error fetching lists: ${error.message}`,
        level: LogLevel.Warning
      })
      return []
    }
  }

  /**
   * Write an entry to the Archive Log list on the hub
   *
   * @param title Title of the log entry
   * @param status Status of the operation (Success, Error, Warning, In Progress)
   * @param operation Type of operation being performed
   * @param message Log message describing the operation
   * @param scope Scope or context of the log entry (Document, List)
   * @param webUrl URL of the web/project being archived
   * @param reference Reference to the item/object being archived
   */
  public async writeToArchiveLog(
    title: string,
    status: string = strings.ArchiveLogStatusSuccess,
    operation: string,
    message: string,
    scope: string,
    webUrl: string,
    reference?: string
  ): Promise<void> {
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
    } catch (error) {
      Logger.log({
        message: `(${this._name}) (writeToArchiveLog) Failed to write archive log entry: ${error.message}`,
        data: { title, webUrl, message, operation, reference, status, error },
        level: LogLevel.Error
      })
    }
  }

  /**
   * Convenience method to log document archiving operations
   *
   * @param documentTitle Title of the document being archived
   * @param documentUrl URL of the document
   * @param projectWebUrl URL of the project web
   * @param status Status of the archiving operation
   * @param errorMessage Optional error message if status is ERROR
   * @param message Optional custom message for the log entry
   */
  public async logDocumentArchive(
    documentTitle: string,
    status: string = strings.ArchiveLogStatusSuccess,
    message: string,
    documentUrl: string,
    projectWebUrl: string,
    errorMessage?: string
  ): Promise<void> {
    const logMessage =
      status === strings.ArchiveLogStatusError && errorMessage ? errorMessage : message || ''

    await this.writeToArchiveLog(
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
   * Convenience method to log list archiving operations
   *
   * @param listTitle Title of the list being archived
   * @param listUrl URL of the list
   * @param projectWebUrl URL of the project web
   * @param status Status of the archiving operation
   * @param errorMessage Optional error message if status is ERROR
   * @param message Optional custom message for the log entry
   */
  public async logListArchive(
    listTitle: string,
    status: string = strings.ArchiveLogStatusSuccess,
    message: string,
    listUrl: string,
    projectWebUrl: string,
    errorMessage?: string
  ): Promise<void> {
    const logMessage =
      status === strings.ArchiveLogStatusError && errorMessage
        ? format(strings.ErrorArchiving, errorMessage)
        : message || ''

    await this.writeToArchiveLog(
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
   * Get information about all archive activity for the current project. The items are grouped by operation and created date.
   *
   * @param projectWebUrl URL of the project web to check
   * @returns Promise<IArchiveStatusInfo | null> Archive information, or null if none found
   */
  public async getArchiveStatus(projectWebUrl: string): Promise<IArchiveStatusInfo | null> {
    try {
      const archiveLogList = this.portalDataService.web.lists.getByTitle(
        resource.Lists_ArchiveLog_Title
      )

      const items = await archiveLogList.items
        .filter(`GtLogWebUrl eq '${projectWebUrl}'`)
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

      const operations: IArchiveOperation[] = Array.from(operationGroups.entries()).map(
        ([groupKey, groupItems]) => {
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
        }
      )

      operations.sort((a, b) => b.date.getTime() - a.date.getTime())

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
