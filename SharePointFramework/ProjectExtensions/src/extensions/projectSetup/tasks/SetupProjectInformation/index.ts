import { stringIsNullOrEmpty } from '@pnp/core'
import _ from 'lodash'
import { format, isUnauthorizedError, ProjectPropertiesMapType } from 'pp365-shared-library'
import * as strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from 'extensions/projectSetup'
import { NO_TEMPLATE_ID } from '../../constants'
import { recordListContent } from '../../listContentRecord'
import resource from 'SharedResources'
import { SPDataAdapter } from '../../../../data'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'

/**
 * Synchronizes local project properties and registers the project on the hub when permitted.
 */
export class SetupProjectInformation extends BaseTask {
  private _templateParameters: Record<string, any>

  constructor(data: IProjectSetupData) {
    super('SetupProjectInformation', data)
  }

  /** Writes local metadata, ensures hub registration and marks source idea data as synchronized. */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    super.initExecute(params, onProgress)
    try {
      this._templateParameters = params.templateSchema.Parameters
      await this._syncPropertiesList()
      if (this.data.hasHubWriteAccess === false) {
        this._logHubWriteSkipped(strings.HubWriteSkippedLogText)
      } else {
        await this._addEntryToHub()
      }
      if (this.data.projectData && this.data.hasHubWriteAccess !== false) {
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
   * Ensures the local properties schema and writes mapped project and template metadata.
   * Setup without a template uses the existing list without synchronizing content-type fields.
   */
  private async _syncPropertiesList() {
    try {
      this.onProgress(
        strings.SetupProjectInformationText,
        strings.SyncLocalProjectPropertiesListText,
        'AlignCenter'
      )
      const isNoTemplate = this.data.selectedTemplate?.id === NO_TEMPLATE_ID

      if (isNoTemplate) {
        this.onProgress(
          strings.SetupProjectInformationText,
          strings.CreatingLocalProjectPropertiesListItemText,
          'AlignCenter'
        )
        const list = this.params.web.lists.getByTitle(resource.Lists_ProjectProperties_Title)
        const properties = this._createPropertiesItem(this.params)
        const propertyItems = await list.items()
        if (propertyItems.length > 0) {
          await list.items.getById(1).update(properties)
        } else {
          await list.items.add(properties)
        }
      } else {
        const { list } = await this.params.portalDataService.syncList({
          url: this.params.webAbsoluteUrl,
          listName: resource.Lists_ProjectProperties_Title,
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
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Maps source project data to local or portfolio properties using the selected content type.
   *
   * @param useSharePointTaxonomyHiddenFields Whether taxonomy is serialized through hidden text fields.
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
        resource.Lists_ProjectProperties_Title,
      mapType,
      projectContentTypeId: this._templateParameters.ProjectContentTypeId,
      customSiteFieldsGroup: this._templateParameters.CustomSiteFields,
      projectDataSync: mapType === ProjectPropertiesMapType.FromPortfolioToPortfolio
    })
  }

  /**
   * Builds project metadata, preserving earlier list-content records and omitting versions without a template.
   */
  private _createPropertiesItem(
    params: IBaseTaskParams,
    additionalProperties: Record<string, string | boolean | number> = {}
  ): Record<string, string | boolean | number> {
    const isNoTemplate = this.data.selectedTemplate?.id === NO_TEMPLATE_ID
    const properties: Record<string, string | boolean | number> = {
      Title: params.context.pageContext.web.title,
      GtIsProgram: this.data.selectedTemplate.isProgram,
      GtIsParentProject: this.data.selectedTemplate.isParentProject,
      GtProjectTemplate: this.data.selectedTemplate.text,
      GtProjectExtensions: (this.data.selectedExtensions ?? []).map((e) => e.text).join(', '),
      GtProjectListContent: recordListContent(
        this.data.addedListContent,
        this.data.selectedContentConfig ?? []
      ),
      ...additionalProperties
    }
    if (!isNoTemplate) {
      properties.GtInstalledVersion = params.templateSchema.Version
      properties.GtCurrentVersion = params.templateSchema.Version
    }
    return properties
  }

  /**
   * Creates the hub entry if the group is not registered, mapping portfolio properties when applicable.
   * Permission failures disable subsequent hub writes without aborting local setup.
   */
  private async _addEntryToHub() {
    try {
      const { pageContext } = this.params.context
      const groupId = pageContext.legacyPageContext.groupId
      const entity = await this.params.entityService.getEntityItem(groupId)
      if (entity) return
      const siteId = pageContext.site.id.toString()
      const webUrl = pageContext.web.absoluteUrl
      const isNoTemplate = this.data.selectedTemplate?.id === NO_TEMPLATE_ID
      const contentTypeId = isNoTemplate ? undefined : this._templateParameters.ProjectContentTypeId
      const projectDataProperties = isNoTemplate
        ? {}
        : await this._getProjectDataProperties(
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
      if (!isUnauthorizedError(error)) throw error
      // The hub can reject the entry although the access check before the setup
      // passed (or could not be made). The project site is still usable, so the
      // setup continues and the remaining tasks skip their hub writes.
      this.data.hasHubWriteAccess = false
      this._logHubWriteSkipped(
        format(
          strings.HubWriteDeniedLogText,
          `${error?.status ?? 'n/a'}, SPRequestGuid: ${
            error?.response?.headers?.get?.('sprequestguid') ?? 'n/a'
          }`
        )
      )
    }
  }

  /** Reports skipped hub registration through task logging and the advanced progress log. */
  private _logHubWriteSkipped(message: string) {
    this.logWarning(message)
    this.onProgress(strings.SetupProjectInformationText, message, 'AlignCenter', {
      message,
      level: 'warning'
    })
  }
}
