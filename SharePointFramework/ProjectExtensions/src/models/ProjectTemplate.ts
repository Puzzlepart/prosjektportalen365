import { IIconProps } from '@fluentui/react'
import { TypedHash } from '@pnp/common'
import { Web } from '@pnp/sp'
import { Schema } from 'sp-js-provisioning'
import { isArray } from 'underscore'
import { ContentConfig } from './ContentConfig'
import { ProjectExtension } from './ProjectExtension'
import { UserSelectableObject } from './UserSelectableObject'

export interface IProjectTemplateSPItem {
  Id?: number
  IsDefaultTemplate?: boolean
  IsDefaultExtensionsLocked?: boolean
  IsDefaultListContentLocked?: boolean
  IconName?: string
  ListContentConfigLookupId?: number[]
  File?: { UniqueId: string; Name: string; Title: string; ServerRelativeUrl: string }
  FieldValuesAsText?: TypedHash<string>
  GtProjectTemplateId?: number
  GtProjectExtensionsId?: number[]
  GtProjectColumns: string
  GtProjectCustomColumns: string
  GtProjectContentType: string
  GtProjectStatusContentType: string
  GtIsProgram: boolean
  GtIsParentProject: boolean
  IsHiddenTemplate: boolean
  GtProjectPhaseTermId: string
}

/**
 * @model ProjectTemplate
 */
export class ProjectTemplate extends UserSelectableObject {
  public iconProps: Pick<IIconProps, 'iconName' | 'styles'>
  public projectTemplateId: number = -1
  public projectTemplateUrl: string
  public contentConfig: number[] = []
  public isDefaultContentConfigLocked: boolean
  public extensions: number[] = []
  public isDefaultExtensionsLocked: boolean
  public isProgram: boolean
  public isParentProject: boolean
  public isForced: boolean = false
  private _projectContentType: string
  private _projectStatusContentType: string
  private _projectColumns: string
  private _projectCustomColumns: string
  private _projectPhaseTermId: string

  constructor(spItem: IProjectTemplateSPItem, public web: Web) {
    super(
      spItem.Id,
      spItem.FieldValuesAsText.Title,
      spItem.FieldValuesAsText.GtDescription,
      spItem.IsDefaultTemplate,
      false,
      spItem.IsHiddenTemplate
    )
    this.iconProps = { iconName: spItem.IconName }
    this.isDefaultExtensionsLocked = spItem?.IsDefaultExtensionsLocked
    this.isDefaultContentConfigLocked = spItem?.IsDefaultListContentLocked
    this.projectTemplateId = spItem.GtProjectTemplateId
    this.contentConfig = isArray(spItem.ListContentConfigLookupId)
      ? spItem.ListContentConfigLookupId
      : []
    this.extensions = isArray(spItem.GtProjectExtensionsId) ? spItem.GtProjectExtensionsId : []
    this.isProgram = spItem.GtIsProgram
    this.isParentProject = spItem.GtIsParentProject
    this._projectContentType = spItem.GtProjectContentType
    this._projectStatusContentType = spItem.GtProjectStatusContentType
    this._projectColumns = spItem.GtProjectColumns
    this._projectCustomColumns = spItem.GtProjectCustomColumns
    this._projectPhaseTermId = spItem.GtProjectPhaseTermId
  }

  /**
   * Get content configurations for the template
   *
   * @param contentConfig Available content configurations
   */
  public getContentConfig(contentConfig: ContentConfig[]) {
    return contentConfig.filter(
      (lcc) => lcc.isDefaultForTemplate(this) || this.contentConfig.some((id) => id === lcc.id)
    )
  }

  /**
   * Get extensions for the template
   *
   * @param extensions Available extensions
   */
  public getExtensions(extensions: ProjectExtension[]) {
    return extensions.filter(
      (ext) => ext.isDefaultForTemplate(this) || this.extensions.some((id) => id === ext.id)
    )
  }

  public async getSchema(): Promise<Schema> {
    const schema = await this.web.getFileByServerRelativeUrl(this.projectTemplateUrl).getJSON()
    schema.Parameters = schema.Parameters || {}
    schema.Parameters.ProjectContentTypeId =
      this._projectContentType ?? schema.Parameters.ProjectContentTypeId
    schema.Parameters.ProjectStatusContentTypeId =
      this._projectStatusContentType ?? schema.Parameters.ProjectStatusContentTypeId
    schema.Parameters.ProvisionSiteFields =
      this._projectColumns ?? schema.Parameters.ProvisionSiteFields
    schema.Parameters.CustomSiteFields =
      this._projectCustomColumns ?? schema.Parameters.CustomSiteFields
    schema.Parameters.TermSetIds = schema.Parameters.TermSetIds ?? {}
    schema.Parameters.TermSetIds.GtProjectPhase =
      this._projectPhaseTermId ?? schema.Parameters.TermSetIds.GtProjectPhase
    return schema
  }
}
