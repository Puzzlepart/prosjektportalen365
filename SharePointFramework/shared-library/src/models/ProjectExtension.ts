/* eslint-disable max-classes-per-file */
import { IWeb } from '@pnp/sp/webs'
import { Schema } from 'sp-js-provisioning'
import { ProjectTemplate } from './ProjectTemplate'
import { UserSelectableObject } from './UserSelectableObject'

export interface IProjectExtensionSPItem {
  Id: number
  FieldValuesAsText?: Record<string, string>
  GtExtensionDefault?: boolean
  GtExtensionHidden?: boolean
  GtExtensionLocked?: boolean
  File?: { UniqueId: string; Name: string; Title: string; ServerRelativeUrl: string }
}

/**
 * @model ProjectExtension
 */
export class ProjectExtension extends UserSelectableObject {
  public serverRelativeUrl: string

  constructor(spItem: IProjectExtensionSPItem, public web: IWeb) {
    super(
      spItem.Id,
      spItem.File.Title,
      spItem.FieldValuesAsText.GtDescription,
      spItem.GtExtensionDefault,
      spItem.GtExtensionLocked,
      spItem.GtExtensionHidden
    )
    this.serverRelativeUrl = spItem.File.ServerRelativeUrl
  }

  /**
   * Checks if the project extension is mandatory for the specified template. It's either
   * locked and default on the project extension element itself, or it's connected to the
   * template and `isDefaultExtensionsLocked` is set to true.
   *
   * @param template Project template
   */
  public isMandatoryForTemplate(template: ProjectTemplate): boolean {
    return (
      (this.isLocked && this.isDefault) ||
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
  public async getSchema(): Promise<Schema> {
    return await this.web.getFileByServerRelativePath(this.serverRelativeUrl).getJSON()
  }
}
