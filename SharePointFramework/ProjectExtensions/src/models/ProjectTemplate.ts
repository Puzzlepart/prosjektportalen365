import { IIconProps } from '@fluentui/react'
import { Schema } from 'sp-js-provisioning'
import { isArray } from 'underscore'
import { ContentConfig } from './ContentConfig'
import { ProjectExtension } from './ProjectExtension'
import { UserSelectableObject } from './UserSelectableObject'
import { IWeb } from '@pnp/sp/webs'

export interface IProjectTemplateSPItem {
  Id?: number
  IsDefaultTemplate?: boolean
  IsDefaultExtensionsLocked?: boolean
  IsDefaultListContentLocked?: boolean
  IsAutoConfigurable?: boolean
  IconName?: string
  ListContentConfigLookupId?: number[]
  File?: { UniqueId: string; Name: string; Title: string; ServerRelativeUrl: string }
  FieldValuesAsText?: Record<string, string>
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
  GtDocumentTemplateLibrary: string
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
  public isLocked: boolean = false
  public templateLibraryUrl: string
  private _autoConfigurable: boolean = false
  private _projectContentType: string
  private _projectStatusContentType: string
  private _projectColumns: string
  private _projectCustomColumns: string
  private _projectPhaseTermId: string

  /**
   * Constructs a new `ProjectTemplate` instance
   *
   * @param spItem SharePoint list item
   * @param web The `Web` instance (from `@pnp/sp`) to use when loading the template
   */
  constructor(spItem: IProjectTemplateSPItem, public web: IWeb) {
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
    this.templateLibraryUrl = spItem.GtDocumentTemplateLibrary
    this._autoConfigurable = spItem.IsAutoConfigurable
    this._projectContentType = spItem.GtProjectContentType
    this._projectStatusContentType = spItem.GtProjectStatusContentType
    this._projectColumns = spItem.GtProjectColumns
    this._projectCustomColumns = spItem.GtProjectCustomColumns
    this._projectPhaseTermId = spItem.GtProjectPhaseTermId
  }

  /**
   * Returns `true` if the template is set as auto configurable and the
   * template is locked.
   */
  public get autoConfigure(): boolean {
    return this._autoConfigurable && this.isLocked
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

  /**
   * Get the schema for the template from the URL provided by the lookup field
   * for the JSON template file. The schema is then modified to include the
   * content type and column IDs for the project and project status content types
   * and the term set ID for the project phase term set which is configured
   * in the SharePoint list item.
   *
   * @returns The schema for the template
   */
  public async getSchema(): Promise<Schema> {
    const schema = await this.web.getFileByServerRelativePath(this.projectTemplateUrl).getJSON()
    schema.Parameters = {
      ...(schema.Parameters ?? {}),
      ProjectContentTypeId: this._projectContentType ?? schema.Parameters.ProjectContentTypeId,
      ProjectStatusContentTypeId:
        this._projectStatusContentType ?? schema.Parameters.ProjectStatusContentTypeId,
      ProvisionSiteFields: this._projectColumns ?? schema.Parameters.ProvisionSiteFields,
      CustomSiteFields: this._projectCustomColumns ?? schema.Parameters.CustomSiteFields,
      TermSetIds: {
        ...(schema.Parameters?.TermSetIds ?? {}),
        GtProjectPhase: this._projectPhaseTermId ?? schema.Parameters.TermSetIds.GtProjectPhase
      }
    }
    return schema
  }
}
