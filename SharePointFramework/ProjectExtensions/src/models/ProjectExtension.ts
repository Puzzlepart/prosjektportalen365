/* eslint-disable max-classes-per-file */
import { TypedHash } from '@pnp/common'
import { Web } from '@pnp/sp'
import { Schema } from 'sp-js-provisioning'
import { UserSelectableObject } from './UserSelectableObject'

export interface IProjectExtensionSPItem {
  Id: number
  FieldValuesAsText?: TypedHash<string>
  GtExtensionDefault?: boolean
  GtExtensionHidden?: boolean
  GtExtensionLocked?: boolean
  File?: { UniqueId: string; Name: string; Title: string; ServerRelativeUrl: string }
}

export class ProjectExtension extends UserSelectableObject {
  public serverRelativeUrl: string

  constructor(spItem: IProjectExtensionSPItem, public web: Web) {
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

  public async getSchema(): Promise<Schema> {
    return await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getJSON()
  }
}
