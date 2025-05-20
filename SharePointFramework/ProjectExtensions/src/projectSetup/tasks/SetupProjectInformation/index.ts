import { stringIsNullOrEmpty } from '@pnp/core'
import * as strings from 'ProjectExtensionsStrings'
import { ProjectPropertiesMapType } from 'pp365-shared-library'
import { IProjectSetupData } from 'projectSetup'
import { SPDataAdapter } from '../../../data'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'
import _ from 'lodash'

/**
 * Setup project information task handles the following tasks:
 * * Sync local properties list on the current project site. If the list does not exist, it will be created
 * using `portal.syncList`. If the list exists, it will be updated with the current project information and
 * the template parameters.
 * * Add entry to hub project list
 */
export class SetupProjectInformation extends BaseTask {
  private _templateParameters: Record<string, any>

  constructor(data: IProjectSetupData) {
    super('SetupProjectInformation', data)
  }

  /**
   * Executes the `SetupProjectInformation` task
   *
   * @param params Task parameters
   * @param onProgress On progress funtion
   */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    super.initExecute(params, onProgress)
    try {
      this._templateParameters = params.templateSchema.Parameters
      await this._syncPropertiesList()
      await this._addEntryToHub()
      if (this.data.projectData) {
        await SPDataAdapter.portalDataService.updateIdeaData(
          this.data.projectData,
          strings.IdeaDecisionStatusApprovedAndSynced
        )
      }
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
   * - `TemplateParameters`: The template parameters as JSON string
   * - `IsProgram`: `true` if the current project is a program, `false` otherwise
   * - `IsParentProject`: `true` if the current project is a parent project, `false` otherwise
   * - `GtInstalledVersion`: The installed version
   * - `GtCurrentVersion`: The current version (same as installed version initially)
   * - `GtProjectTemplate`: The selected project template name
   *
   * Also properties from the project data are mapped to the property item. The mapping is done using the
   * `SPDataAdapter.getMappedProjectProperties` method with the mapping type
   * `ProjectPropertiesMapType.FromPortfolioToProject`.
   */
  private async _syncPropertiesList() {
    try {
      this.onProgress(
        strings.SetupProjectInformationText,
        strings.SyncLocalProjectPropertiesListText,
        'AlignCenter'
      )
      const { list } = await this.params.portalDataService.syncList({
        url: this.params.webAbsoluteUrl,
        listName: strings.ProjectPropertiesListName,
        contentTypeId: this._templateParameters.ProjectContentTypeId
      })
      this.onProgress(
        strings.SetupProjectInformationText,
        strings.CreatingLocalProjectPropertiesListItemText,
        'AlignCenter'
      )
      const projectDataProperties = await this._getProjectDataProperties()
      let properties = this._createPropertiesItem(this.params, {
        ...projectDataProperties,
        TemplateParameters: JSON.stringify(this._templateParameters)
      })
      if (this.params.properties.skipUpdateTemplateParameters) {
        properties = _.omit(properties, 'TemplateParameters')
      }
      const propertyItems = await list.items()
      const propertyItem = list.items.getById(1)
      if (propertyItems.length > 0) await propertyItem.update(properties)
      else await list.items.add(properties)
    } catch (error) {
      throw error
    }
  }

  /**
   * Get mapped project data properties for the current project.
   *
   * @param mapType The map type (default: `ProjectPropertiesMapType.FromPortfolioToProject`)
   * @param useSharePointTaxonomyHiddenFields If `true`, the SharePoint taxonomy hidden fields will be used (default: `true`)
   *
   * @returns The mapped project data properties
   */
  private async _getProjectDataProperties(
    mapType = ProjectPropertiesMapType.FromPortfolioToProject,
    useSharePointTaxonomyHiddenFields = true
  ): Promise<Record<string, any>> {
    if (!this.data.projectData) return {}
    return await SPDataAdapter.getMappedProjectProperties(this.data.projectData, {
      useSharePointTaxonomyHiddenFields,
      targetListName:
        mapType === ProjectPropertiesMapType.FromPortfolioToProject &&
        strings.ProjectPropertiesListName,
      mapType,
      projectContentTypeId: this._templateParameters.ProjectContentTypeId,
      customSiteFieldsGroup: this._templateParameters.CustomSiteFields
    })
  }

  /**
   * Create property item with the following properties:
   * - `Title`: The current web title
   * - `IsProgram`: `true` if the current project is a program, `false` otherwise
   * - `IsParentProject`: `true` if the current project is a parent project, `false` otherwise
   * - `GtInstalledVersion`: The installed version
   * - `GtCurrentVersion`: The current version (same as installed version initially)
   * - `GtProjectTemplate`: The selected project template name
   *
   * @param params Params
   * @param additionalProperties Additional properties
   */
  private _createPropertiesItem(
    params: IBaseTaskParams,
    additionalProperties: Record<string, string | boolean | number> = {}
  ): Record<string, string | boolean | number> {
    return {
      Title: params.context.pageContext.web.title,
      GtIsProgram: this.data.selectedTemplate.isProgram,
      GtIsParentProject: this.data.selectedTemplate.isParentProject,
      GtInstalledVersion: params.templateSchema.Version,
      GtCurrentVersion: params.templateSchema.Version,
      GtProjectTemplate: this.data.selectedTemplate.text,
      ...additionalProperties
    }
  }

  /**
   * Add entry to hub project list
   *
   * Stores the project with
   * * `Title`: The current web title
   * * `GtSiteId`: The current site ID
   * * `GtProjectTemplate`: The selected project template name
   * * `ContentTypeId` (if custom content type is specified in template parameters)
   *
   * Also properties from the project data are mapped to the property item. The mapping is done using the
   * `SPDataAdapter.getMappedProjectProperties` method with the mapping type
   * `ProjectPropertiesMapType.FromPortfolioToPortfolio`.
   */
  private async _addEntryToHub() {
    try {
      const { pageContext } = this.params.context
      const groupId = pageContext.legacyPageContext.groupId
      const entity = await this.params.entityService.getEntityItem(groupId)
      if (entity) return
      const siteId = pageContext.site.id.toString()
      const webUrl = pageContext.web.absoluteUrl
      const contentTypeId = this._templateParameters.ProjectContentTypeId
      const projectDataProperties = await this._getProjectDataProperties(
        ProjectPropertiesMapType.FromPortfolioToPortfolio,
        false
      )
      const properties = this._createPropertiesItem(this.params, {
        GtSiteId: siteId,
        ...projectDataProperties
      })
      if (!stringIsNullOrEmpty(contentTypeId)) {
        properties.ContentTypeId = contentTypeId
      }
      await this.params.entityService.createNewEntity(groupId, webUrl, properties)
    } catch (error) {
      throw error
    }
  }
}
