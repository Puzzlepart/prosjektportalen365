import { TypedHash } from '@pnp/common'
import * as strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from 'projectSetup'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'

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
      await this._syncPropertiesList(
        params,
        onProgress,
        this.data.selectedTemplate.isProgram,
        this.data.selectedTemplate.isParentProject
      )
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
   * @param params Task parameters
   * @param onProgress On progress funtion
   */
  private async _syncPropertiesList(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction,
    isProgram: boolean,
    isParent: boolean
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
      const templateParametersString = JSON.stringify(params.templateSchema.Parameters)
      const properties: Record<string, string | boolean | number> = {
        Title: params.context.pageContext.web.title,
        TemplateParameters: templateParametersString,
        GtIsProgram: isProgram,
        GtIsParentProject: isParent,
        GtInstalledVersion: params.templateSchema.Version,
        GtCurrentVersion: params.templateSchema.Version,
      }
      const propertyItem = list.items.getById(1)
      const items = await list.items.getAll()

      if (items.length >= 1) {
        await propertyItem.update(properties)
      } else {
        await list.items.add(properties)
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Add entry to hub project list
   *
   * Stores the project with
   * * Title
   * * GtSiteId
   * * GtProjectTemplate
   * * ContentTypeId (if custom content type is specified in template parameters)
   *
   * @param params Task parameters
   */
  private async _addEntryToHub(params: IBaseTaskParams) {
    try {
      const entity = await params.entityService.getEntityItem(
        params.context.pageContext.legacyPageContext.groupId
      )
      if (entity) return
      const properties: TypedHash<any> = {
        Title: params.context.pageContext.web.title,
        GtSiteId: params.context.pageContext.site.id.toString(),
        GtProjectTemplate: this.data.selectedTemplate.text,
        GtIsProgram: this.data.selectedTemplate.isProgram,
        GtIsParentProject: this.data.selectedTemplate.isParentProject
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
