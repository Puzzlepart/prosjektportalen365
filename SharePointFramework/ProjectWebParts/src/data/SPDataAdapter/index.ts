import { IProgressIndicatorProps } from '@fluentui/react/lib/ProgressIndicator'
import { LogLevel, Logger } from '@pnp/logging'
import * as strings from 'ProjectWebPartsStrings'
import { ItemFieldValues } from 'pp365-shared-library'
import { DefaultCaching, SPDataAdapterBase } from 'pp365-shared-library/lib/data'
import { IProjectDataServiceParams, ProjectDataService } from 'pp365-shared-library/lib/services'
import { SPFxContext } from 'pp365-shared-library/lib/types'
import { IConfigurationFile } from 'types'
import { ISPDataAdapterConfiguration, IArchiveLogEntry, ArchiveLogStatus, ArchiveLogOperation, IArchiveDocumentItem, IArchiveListItem } from './types'
import resource from 'SharedResources'

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
   * Get site lists for archiving (excluding system lists)
   */
  public async getListsForArchive(): Promise<IArchiveListItem[]> {
    try {
      const lists = await this.sp.web.lists
        .select('Id', 'Title', 'DefaultViewUrl', 'Hidden', 'BaseTemplate')
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
        type: 'list'
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
   * Archive log status enum for better type safety
   */
  public readonly ArchiveLogStatus: Record<string, ArchiveLogStatus> = {
    SUCCESS: 'Success',
    ERROR: 'Error',
    WARNING: 'Warning',
    IN_PROGRESS: 'In Progress'
  } as const

  /**
   * Archive log operation enum for better type safety
   */
  public readonly ArchiveLogOperation: Record<string, ArchiveLogOperation> = {
    DOCUMENT_ARCHIVE: 'Document Archive',
    LIST_ARCHIVE: 'List Archive'
  } as const

  /**
   * Write an entry to the Arkiveringslogg (Archive Log) list on the hub
   *
   * @param title Title of the log entry
   * @param webUrl URL of the web/project being archived
   * @param message Log message describing the operation
   * @param operation Type of operation being performed
   * @param reference Reference to the item/object being archived
   * @param status Status of the operation (Success, Error, Warning, In Progress)
   */
  public async writeToArchiveLog(
    title: string,
    webUrl: string,
    message: string,
    operation: ArchiveLogOperation,
    reference?: string,
    status: ArchiveLogStatus = this.ArchiveLogStatus.SUCCESS
  ): Promise<void> {
    try {
      const archiveLogList = this.portalDataService.web.lists.getByTitle('Arkiveringslogg')

      const logItem: IArchiveLogEntry = {
        Title: title,
        GtLogWebUrl: webUrl,
        GtLogMessage: message,
        GtLogOperation: operation,
        GtLogReference: reference || '',
        GtLogStatus: status
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
      // Don't throw error to avoid breaking the main operation
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
   */
  public async logDocumentArchive(
    documentTitle: string,
    documentUrl: string,
    projectWebUrl: string,
    status: ArchiveLogStatus = this.ArchiveLogStatus.SUCCESS,
    errorMessage?: string
  ): Promise<void> {
    const message = status === this.ArchiveLogStatus.ERROR && errorMessage
      ? `Error archiving document: ${errorMessage}`
      : `Document '${documentTitle}' ${status.toLowerCase()}`

    await this.writeToArchiveLog(
      `Document Archive: ${documentTitle}`,
      projectWebUrl,
      message,
      this.ArchiveLogOperation.DOCUMENT_ARCHIVE,
      documentUrl,
      status
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
   */
  public async logListArchive(
    listTitle: string,
    listUrl: string,
    projectWebUrl: string,
    status: ArchiveLogStatus = this.ArchiveLogStatus.SUCCESS,
    errorMessage?: string
  ): Promise<void> {
    const message = status === this.ArchiveLogStatus.ERROR && errorMessage
      ? `Error archiving list: ${errorMessage}`
      : `List '${listTitle}' ${status.toLowerCase()}`

    await this.writeToArchiveLog(
      `List Archive: ${listTitle}`,
      projectWebUrl,
      message,
      this.ArchiveLogOperation.LIST_ARCHIVE,
      listUrl,
      status
    )
  }

  /**
   * Convenience method to log project archiving operations
   *
   * @param projectTitle Title of the project being archived
   * @param projectWebUrl URL of the project web
   * @param status Status of the archiving operation
   * @param errorMessage Optional error message if status is ERROR
   */
  public async logProjectArchive(
    projectTitle: string,
    projectWebUrl: string,
    status: ArchiveLogStatus = this.ArchiveLogStatus.SUCCESS,
    errorMessage?: string
  ): Promise<void> {
    const message = status === this.ArchiveLogStatus.ERROR && errorMessage
      ? `Error archiving project: ${errorMessage}`
      : `Project '${projectTitle}' ${status.toLowerCase()}`

    await this.writeToArchiveLog(
      `Project Archive: ${projectTitle}`,
      projectWebUrl,
      message,
      this.ArchiveLogOperation.PROJECT_ARCHIVE,
      projectWebUrl,
      status
    )
  }
}

export default new SPDataAdapter()
