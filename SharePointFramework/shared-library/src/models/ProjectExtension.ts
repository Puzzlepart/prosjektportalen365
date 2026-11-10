import { IWeb } from '@pnp/sp/webs'
import { ProvisioningSchema } from './ProvisioningSchema'
import { ProjectTemplate } from './ProjectTemplate'
import { UserSelectableObject } from './UserSelectableObject'

export interface IProjectExtensionSPItem {
  Id: number
  FieldValuesAsText?: Record<string, string>
  GtExtensionDefault?: boolean
  GtExtensionHidden?: boolean
  GtExtensionLocked?: boolean
  GtShieldsProjectData?: boolean
  File?: { UniqueId: string; Name: string; Title: string; ServerRelativeUrl: string }
}

/**
 * @model ProjectExtension
 */
export class ProjectExtension extends UserSelectableObject {
  public serverRelativeUrl: string

  /**
   * Whether the extension shields the project's data (`GtShieldsProjectData`): the project keeps
   * it on its own site instead of on the hub.
   */
  public shieldsProjectData: boolean

  constructor(
    spItem: IProjectExtensionSPItem,
    public web: IWeb
  ) {
    super(
      spItem.Id,
      spItem.File.Title,
      spItem.FieldValuesAsText.GtDescription,
      spItem.GtExtensionDefault,
      spItem.GtExtensionLocked,
      spItem.GtExtensionHidden
    )
    this.serverRelativeUrl = spItem.File.ServerRelativeUrl
    this.shieldsProjectData = !!spItem.GtShieldsProjectData
  }

  /**
   * Checks if the project extension is mandatory for the specified template. It's either
   * locked and default for the template (default on the project extension element itself,
   * or connected to the template), or it's connected to the template and
   * `isDefaultExtensionsLocked` is set to true on the template.
   *
   * @param template Project template
   */
  public isMandatoryForTemplate(template: ProjectTemplate): boolean {
    return (
      (this.isLocked && this.isDefaultForTemplate(template)) ||
      (template?.isDefaultExtensionsLocked && template?.extensions.includes(this.id))
    )
  }

  /**
   * Checks if the project extension is default for the specified template. It's either
   * default on the project extension element itself, or it's connected to the template.
   *
   * @param template Project template
   */
  public isDefaultForTemplate(template?: ProjectTemplate): boolean {
    return this.isDefault || template?.extensions.includes(this.id)
  }

  /**
   * Get the schema of the project extension (JSON)
   */
  public async getSchema(): Promise<ProvisioningSchema> {
    return await this.web.getFileByServerRelativePath(this.serverRelativeUrl).getJSON()
  }
}
