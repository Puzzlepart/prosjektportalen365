import * as strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from 'projectSetup'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'
import _ from 'underscore'

export class SetupProjectInformation extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('SetupProjectInformation', data)
  }

  /**
   * Executes the SetupProjectInformation task
   *
   * @param params Task parameters
   * @param onProgress On progress funtion
   */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    try {
      await this._syncPropertiesList(params, onProgress)
      await this._addEntryToHub(params)
      return params
    } catch (error) {
      throw new BaseTaskError(this.taskName, strings.SetupProjectInformationErrorMessage, error)
    }
  }

  /**
   * Sync local properties list on the current project site. If the list does not exist, it will be created
   * using `portal.syncList`. If the list exists, it will be updated with the current project information and
   * the template parameters.
   *
   * The following properties are set for the property item initially:
   * - `Title`: The current web title
   * - `IsProgram`: `true` if the current project is a program, `false` otherwise
   * - `IsParentProject`: `true` if the current project is a parent project, `false` otherwise
   * - `TemplateParameters`: The template parameters as JSON string
   *
   * @param params Task parameters
   * @param onProgress On progress function
   */
  private async _syncPropertiesList(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ) {
    try {
      onProgress(
        strings.SetupProjectInformationText,
        strings.SyncLocalProjectPropertiesListText,
        'AlignCenter'
      )
      const { list } = await params.portal.syncList(
        params.webAbsoluteUrl,
        strings.ProjectPropertiesListName,
        params.templateSchema.Parameters.ProjectContentTypeId
      )
      onProgress(
        strings.SetupProjectInformationText,
        strings.CreatingLocalProjectPropertiesListItemText,
        'AlignCenter'
      )
      const properties = this._createPropertyItem(params, [
        'GtInstalledVersion',
        'GtCurrentVersion',
        'GtSiteId',
        'GtProjectTemplate'
      ])
      const propertyItem = list.items.getById(1)
      const propertyItems = await list.items.getAll()
      if (propertyItems.length >= 1) {
        await propertyItem.update(properties)
      } else {
        await list.items.add(properties)
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Create property item with the following properties:
   * - `Title`: The current web title
   * - `IsProgram`: `true` if the current project is a program, `false` otherwise
   * - `IsParentProject`: `true` if the current project is a parent project, `false` otherwise
   * - `GtInstalledVersion`: The installed version
   * - `GtCurrentVersion`: The current version (same as installed version initially)
   * - `TemplateParameters`: The template parameters as JSON string
   * - `GtSiteId`: The current site id
   * - `GtProjectTemplate`: The selected project template
   *
   * @param params Params
   * @param omit Properties to omit from the object
   */
  private _createPropertyItem(
    params: IBaseTaskParams,
    omit: string[] = []
  ): Record<string, string | boolean | number> {
    return _.omit(
      {
        Title: params.context.pageContext.web.title,
        GtIsProgram: this.data.selectedTemplate.isProgram,
        GtIsParentProject: this.data.selectedTemplate.isParentProject,
        GtInstalledVersion: params.templateSchema.Version,
        GtCurrentVersion: params.templateSchema.Version,
        TemplateParameters: JSON.stringify(params.templateSchema.Parameters),
        GtSiteId: params.context.pageContext.site.id.toString(),
        GtProjectTemplate: this.data.selectedTemplate.text
      },
      omit
    )
  }

  /**
   * Add entry to hub project list. Uses `this._createPropertyItem` to create the property item,
   * and `entityService.createNewEntity` to create the entry in the hub site.
   *
   * @param params Task parameters
   */
  private async _addEntryToHub(params: IBaseTaskParams) {
    try {
      const entity = await params.entityService.getEntityItem(
        params.context.pageContext.legacyPageContext.groupId
      )
      if (entity) return
      const properties: Record<string, string | boolean | number> = {
        ...this._createPropertyItem(params, ['TemplateParameters'])
      }
      if (params.templateSchema.Parameters.ProjectContentTypeId) {
        properties.ContentTypeId = params.templateSchema.Parameters.ProjectContentTypeId
      }
      await params.entityService.createNewEntity(
        params.context.pageContext.legacyPageContext.groupId,
        params.context.pageContext.web.absoluteUrl,
        properties
      )
    } catch (error) {
      throw error
    }
  }
}
