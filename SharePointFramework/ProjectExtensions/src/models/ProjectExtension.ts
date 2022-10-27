import { getId, IObjectWithKey } from '@fluentui/react'
import { TypedHash } from '@pnp/common'
import { Web } from '@pnp/sp'
import { Schema } from 'sp-js-provisioning'
import { ProjectTemplate } from './ProjectTemplate'

export interface IProjectExtension {
  Id: number
  FieldValuesAsText?: TypedHash<string>
  key: string
  GtExtensionDefault?: boolean
  GtExtensionHidden?: boolean
  GtExtensionLocked?: boolean
  File?: { UniqueId: string; Name: string; Title: string; ServerRelativeUrl: string }
}

export class ProjectExtension implements IObjectWithKey {
  public id: number
  public key: string
  public text: string
  public isDefault: boolean
  public hidden: boolean
  private _isLocked: boolean
  public subText: string
  public serverRelativeUrl: string

  constructor(spItem: IProjectExtension, public web: Web) {
    this.key = getId(`projecttemplate_${spItem.Id}`)
    this.text = spItem.File.Title
    this.isDefault = spItem.GtExtensionDefault
    this.hidden = spItem.GtExtensionHidden
    this._isLocked = spItem.GtExtensionLocked ?? true
    this.subText = spItem.FieldValuesAsText.GtDescription
    this.serverRelativeUrl = spItem.File.ServerRelativeUrl
    this.id = spItem.Id
  }

  /**
   * Checks if the project extension is locked for the specified template
   *
   * @param template Project template
   */
  public isLocked(template: ProjectTemplate): boolean {
    return this._isLocked || (template?.isDefaultExtensionsLocked && template?.extensionIds.includes(this.id))
  }

  public async getSchema(): Promise<Schema> {
    return await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getJSON()
  }
}
