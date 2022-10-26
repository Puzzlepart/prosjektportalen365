import { Web } from '@pnp/sp'
import { IDropdownOption } from '@fluentui/react/lib/Dropdown'
import { TypedHash } from '@pnp/common'
import { Schema } from 'sp-js-provisioning'
import { getId } from '@fluentui/react'

export interface IProjectExtension {
  Id: number
  FieldValuesAsText?: TypedHash<string>
  key: string
  GtExtensionDefault?: boolean
  File?: { UniqueId: string; Name: string; Title: string; ServerRelativeUrl: string }
}

export class ProjectExtension implements Omit<IDropdownOption, 'id'> {
  public id: number
  public key: string
  public text: string
  public isDefault: boolean
  public subText: string
  public serverRelativeUrl: string

  constructor(spItem: IProjectExtension, public web: Web) {
    this.key = getId(`projecttemplate_${spItem.Id}`)
    this.text = spItem.File.Title
    this.isDefault = spItem.GtExtensionDefault
    this.subText = spItem.FieldValuesAsText.GtDescription
    this.serverRelativeUrl = spItem.File.ServerRelativeUrl
    this.id = spItem.Id
  }

  public async getSchema(): Promise<Schema> {
    return await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getJSON()
  }
}
